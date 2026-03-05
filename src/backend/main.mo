import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "./authorization/access-control";
import Prim "mo:prim";
import Runtime "mo:core/Runtime";

actor {
  // ─── Authorization ────────────────────────────────────────────────────────
  var accessControlState = AccessControl.initState();

  public shared ({ caller }) func _initializeAccessControlWithSecret(userSecret : Text) : async () {
    switch (Prim.envVar<system>("CAFFEINE_ADMIN_TOKEN")) {
      case (null) { Runtime.trap("CAFFEINE_ADMIN_TOKEN not set") };
      case (?adminToken) { AccessControl.initialize(accessControlState, caller, adminToken, userSecret) };
    };
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller)
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller)
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role)
  };

  // ─── Types ────────────────────────────────────────────────────────────────
  public type PostCategory = { #Announcement; #Petition };

  public type Post = {
    id : Nat;
    title : Text;
    description : Text;
    category : PostCategory;
    author : Principal;
    createdAt : Int;
    signatureCount : Nat;
  };

  public type Vault = {
    id : Nat;
    title : Text;
    description : Text;
    targetAmount : Nat;
    currentAmount : Nat;
    deadline : Int;
    creator : Principal;
    createdAt : Int;
    withdrawn : Bool;
    contributorCount : Nat;
  };

  public type Contribution = {
    vaultId : Nat;
    contributor : Principal;
    amount : Nat;
    createdAt : Int;
  };

  // ─── State ────────────────────────────────────────────────────────────────
  var nextPostId : Nat = 0;
  var nextVaultId : Nat = 0;
  var contributionCounter : Nat = 0;

  let posts = Map.empty<Nat, Post>();
  let vaults = Map.empty<Nat, Vault>();
  let signatures = Map.empty<Text, Bool>();
  let contributions = Map.empty<Nat, Contribution>();

  // ─── Bulletin Board ───────────────────────────────────────────────────────

  public shared ({ caller }) func createPost(title : Text, description : Text, category : PostCategory) : async Nat {
    assert (not caller.isAnonymous());
    let id = nextPostId;
    nextPostId += 1;
    let post : Post = {
      id;
      title;
      description;
      category;
      author = caller;
      createdAt = Time.now();
      signatureCount = 0;
    };
    posts.add(id, post);
    id
  };

  public query func getPosts() : async [Post] {
    posts.entries().map(func(kv : (Nat, Post)) : Post { kv.1 }).toArray()
  };

  public query func getPost(id : Nat) : async ?Post {
    posts.get(id)
  };

  public shared ({ caller }) func signPost(postId : Nat) : async Bool {
    assert (not caller.isAnonymous());
    let sigKey = postId.toText() # "#" # caller.toText();
    switch (signatures.get(sigKey)) {
      case (?_) { false };
      case (null) {
        switch (posts.get(postId)) {
          case (null) { false };
          case (?post) {
            if (post.author == caller) { return false };
            signatures.add(sigKey, true);
            let updated : Post = {
              id = post.id;
              title = post.title;
              description = post.description;
              category = post.category;
              author = post.author;
              createdAt = post.createdAt;
              signatureCount = post.signatureCount + 1;
            };
            posts.add(postId, updated);
            true
          };
        };
      };
    };
  };

  public query ({ caller }) func hasSignedPost(postId : Nat) : async Bool {
    let sigKey = postId.toText() # "#" # caller.toText();
    switch (signatures.get(sigKey)) {
      case (?_) { true };
      case (null) { false };
    };
  };

  // ─── Community Vault ──────────────────────────────────────────────────────

  public shared ({ caller }) func createVault(title : Text, description : Text, targetAmount : Nat, deadline : Int) : async Nat {
    assert (not caller.isAnonymous());
    let id = nextVaultId;
    nextVaultId += 1;
    let vault : Vault = {
      id;
      title;
      description;
      targetAmount;
      currentAmount = 0;
      deadline;
      creator = caller;
      createdAt = Time.now();
      withdrawn = false;
      contributorCount = 0;
    };
    vaults.add(id, vault);
    id
  };

  public query func getVaults() : async [Vault] {
    vaults.entries().map(func(kv : (Nat, Vault)) : Vault { kv.1 }).toArray()
  };

  public query func getVault(id : Nat) : async ?Vault {
    vaults.get(id)
  };

  public shared ({ caller }) func contribute(vaultId : Nat, amount : Nat) : async Bool {
    assert (not caller.isAnonymous());
    assert (amount > 0);
    switch (vaults.get(vaultId)) {
      case (null) { false };
      case (?vault) {
        if (vault.withdrawn) { return false };
        let contribId = contributionCounter;
        contributionCounter += 1;
        let c : Contribution = {
          vaultId;
          contributor = caller;
          amount;
          createdAt = Time.now();
        };
        contributions.add(contribId, c);
        let updated : Vault = {
          id = vault.id;
          title = vault.title;
          description = vault.description;
          targetAmount = vault.targetAmount;
          currentAmount = vault.currentAmount + amount;
          deadline = vault.deadline;
          creator = vault.creator;
          createdAt = vault.createdAt;
          withdrawn = vault.withdrawn;
          contributorCount = vault.contributorCount + 1;
        };
        vaults.add(vaultId, updated);
        true
      };
    };
  };

  public shared ({ caller }) func withdrawVault(vaultId : Nat) : async Bool {
    switch (vaults.get(vaultId)) {
      case (null) { false };
      case (?vault) {
        if (vault.creator != caller) { return false };
        if (vault.withdrawn) { return false };
        if (vault.currentAmount < vault.targetAmount) { return false };
        let updated : Vault = {
          id = vault.id;
          title = vault.title;
          description = vault.description;
          targetAmount = vault.targetAmount;
          currentAmount = vault.currentAmount;
          deadline = vault.deadline;
          creator = vault.creator;
          createdAt = vault.createdAt;
          withdrawn = true;
          contributorCount = vault.contributorCount;
        };
        vaults.add(vaultId, updated);
        true
      };
    };
  };

  public query func getContributions(vaultId : Nat) : async [Contribution] {
    let all = contributions.entries().map(func(kv : (Nat, Contribution)) : Contribution { kv.1 }).toArray();
    all.filter(func(c) { c.vaultId == vaultId })
  };
};

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
  var nextPostId : Nat = 5;
  var nextVaultId : Nat = 3;
  var contributionCounter : Nat = 5;

  let demoAuthor : Principal = Principal.fromText("2vxsx-fae");

  let posts = Map.fromIter<Nat, Post>([
    (0, {
      id = 0;
      title = "Planowana przerwa techniczna sieci - 20 marca 2026";
      description = "Informujemy, ze w dniu 20 marca 2026 (piatek) w godzinach 02:00-06:00 planowana jest przerwa techniczna zwiazana z aktualizacja wezlow sieci ICP. W tym czasie dostep do canistrow moze byc ograniczony. Prosimy o zaplanowanie dzialan z wyprzedzeniem.";
      category = #Announcement;
      author = demoAuthor;
      createdAt = 1741650000000000000;
      signatureCount = 12;
    }),
    (1, {
      id = 1;
      title = "Petycja: Dodaj wielojezyczny interfejs do platformy";
      description = "Zwracamy sie z petycja o wdrozenie pelnego wsparcia dla jezyka polskiego, niemieckiego i ukrainskiego w interfejsie platformy. Obecna wersja anglojezyczna ogranicza dostepnosc dla uzytkownikow z Europy Srodkowo-Wschodniej. Prosimy o podjecie dzialan w tej sprawie.";
      category = #Petition;
      author = demoAuthor;
      createdAt = 1741563600000000000;
      signatureCount = 47;
    }),
    (2, {
      id = 2;
      title = "Nowa propozycja standardu tokenow - RFC-07";
      description = "Publikujemy do konsultacji spolecznych projekt RFC-07 dotyczacy standardu tokenow uzytkowych na Internet Computer. Dokument opisuje interfejs, mechanizmy transferu oraz zarzadzanie uprawnieniami. Zapraszamy do skladania uwag poprzez podpisanie petycji popierajacej lub wnoszącej o zmiany.";
      category = #Announcement;
      author = demoAuthor;
      createdAt = 1741477200000000000;
      signatureCount = 8;
    }),
    (3, {
      id = 3;
      title = "Petycja: Transparentnosc w wyborze walidatorow sieci";
      description = "Zadamy pelnej transparentnosci w procesie wyboru i rotacji wezlow walidujacych transakcje. Spolecznosc powinna miec wglad w kryteria doboru, historie aktywnosci i wynagrodzenia wezlow. Podpisz, jesli zgadzasz sie, ze decentralizacja wymaga jawnosci.";
      category = #Petition;
      author = demoAuthor;
      createdAt = 1741390800000000000;
      signatureCount = 83;
    }),
    (4, {
      id = 4;
      title = "Ogłoszenie: Hackathon Web3 - Krakow, kwiecien 2026";
      description = "Zapraszamy do udzialu w ogolnopolskim hackathonie Web3 organizowanym w Krakowie w dniach 18-20 kwietnia 2026. Tematem przewodnim jest Zdecentralizowane aplikacje na ICP. Pula nagrod: 5000 ICP. Rejestracja otwarta do 31 marca.";
      category = #Announcement;
      author = demoAuthor;
      createdAt = 1741304400000000000;
      signatureCount = 24;
    }),
  ].vals());

  let vaults = Map.fromIter<Nat, Vault>([
    (0, {
      id = 0;
      title = "Fundusz Rozwoju Infrastruktury Wezlow";
      description = "Zbieramy srodki na zakup i utrzymanie dodatkowych wezlow sieci, ktore zwiekszą przepustowosc i odpornosc platformy. Fundusze zostana przeznaczone wylacznie na sprzet serwerowy i koszty kolokacji.";
      targetAmount = 2000;
      currentAmount = 1340;
      deadline = 1749686400000000000;
      creator = demoAuthor;
      createdAt = 1741650000000000000;
      withdrawn = false;
      contributorCount = 18;
    }),
    (1, {
      id = 1;
      title = "Nagrody za audyt bezpieczenstwa smart kontraktow";
      description = "Program bug-bounty dla audytorow bezpieczenstwa. Kazdy kto znajdzie krytyczna podatnosc w opublikowanych canisterach spolecznosciowych otrzyma nagrode z tej puli. Cel: zachecenie do profesjonalnych audytow kodu on-chain.";
      targetAmount = 500;
      currentAmount = 500;
      deadline = 1746921600000000000;
      creator = demoAuthor;
      createdAt = 1741563600000000000;
      withdrawn = false;
      contributorCount = 11;
    }),
    (2, {
      id = 2;
      title = "Wsparcie dla studentow - licencje i kursy Web3";
      description = "Zbieramy tokeny na dofinansowanie kursow blockchain i licencji narzedzi developerskich dla studentow uczestniczacych w projektach spolecznosciowych. Priorytet: kierunki informatyczne i telekomunikacyjne.";
      targetAmount = 800;
      currentAmount = 210;
      deadline = 1752364800000000000;
      creator = demoAuthor;
      createdAt = 1741477200000000000;
      withdrawn = false;
      contributorCount = 7;
    }),
  ].vals());

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

# Decentralized Community Board

## Current State

The app has a fully-built Motoko backend canister (`main.mo`) with:
- `createPost`, `getPosts`, `getPost`, `signPost`, `hasSignedPost` for the bulletin board
- `createVault`, `getVaults`, `getVault`, `contribute`, `withdrawVault`, `getContributions` for the community vault
- Authorization system (Internet Identity / Principal-based)

The frontend (`App.tsx`) uses:
- Static seed data (`SEED_POSTS`, `SEED_VAULTS`) hardcoded in the file
- Fake login that sets a hardcoded `"2vxsx-fae...abc"` principal
- Local React state mutations for all actions (sign, create post, contribute, withdraw)
- No actual calls to the backend canister

## Requested Changes (Diff)

### Add
- Real Internet Identity login/logout flow using `AuthClient` from `@dfinity/auth-client`
- Backend actor integration using the generated `backend.ts` bindings
- Loading states for async canister calls
- Error handling for failed canister calls

### Modify
- Replace `SEED_POSTS` / `SEED_VAULTS` with data fetched from `backend.getPosts()` / `backend.getVaults()` on mount and after mutations
- Replace fake `handleLogin` with real `AuthClient.create()` + `authClient.login()` (Internet Identity)
- Replace fake `handleLogout` with `authClient.logout()`
- Replace `handleCreatePost` local state update with `backend.createPost()` + refetch
- Replace `handleSignPost` local state update with `backend.signPost()` + `backend.hasSignedPost()` check
- Replace `handleCreateVault` local state update with `backend.createVault(deadline as bigint nanoseconds)` + refetch
- Replace `handleContribute` local state update with `backend.contribute()` + refetch
- Replace `handleWithdraw` local state update with `backend.withdrawVault()` + refetch
- Convert Motoko `Int`/`Nat` bigint values to JS numbers for display
- Convert Motoko `Principal` to string for display
- Map Motoko variant `{ #Announcement }` / `{ #Petition }` to Polish display strings
- `myPrincipal` set from real `authClient.getIdentity().getPrincipal().toText()`
- `signedByMe` determined by calling `backend.hasSignedPost(id)` for each post after login
- Show loading spinners while fetching data from canister

### Remove
- `SEED_POSTS` and `SEED_VAULTS` constant arrays
- Fake principal string `"2vxsx-fae...abc"`

## Implementation Plan

1. Install `@dfinity/auth-client` if not already available (check package.json)
2. Create a custom hook `useAuth` that wraps `AuthClient` -- exposes `isLoggedIn`, `principal`, `login()`, `logout()`, `identity`
3. Create a custom hook `useBackend` that creates an authenticated actor using the identity from `useAuth`
4. Create a custom hook `usePosts` that:
   - Fetches posts from `backend.getPosts()` on mount and after mutations
   - After login, checks `hasSignedPost` for each post to set `signedByMe`
   - Exposes `createPost`, `signPost` that call canister and then refetch
5. Create a custom hook `useVaults` that:
   - Fetches vaults from `backend.getVaults()` on mount and after mutations
   - Exposes `createVault`, `contribute`, `withdrawVault` that call canister and then refetch
6. Update `App.tsx` to use these hooks, removing all seed data and local state mutations
7. Add loading states: skeleton/spinner while data is being fetched, button disabled states during mutations
8. Handle type conversions: bigint nanoseconds -> JS Date, Principal -> string, Motoko variants -> Polish strings

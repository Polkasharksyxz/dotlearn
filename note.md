cargo init
cargo run
touch src/balances.rs

git add.
git commit -m "add out/expand "
git push

out.rs

這段 Rust 程式碼實作了一個簡單的 **區塊鏈執行環境**，包含 **餘額管理 (Balances)** 和 **存在證明 (Proof of Existence)** 兩個模組，並使用 **BTreeMap** 來管理帳戶餘額與內容所有權。它模擬了一個區塊鏈運行時（Runtime），可以執行區塊並處理交易（Extrinsics）。以下是詳細的結構與運作方式：

---

## **📌 主要模組概覽**
1. **system** - 負責管理區塊鏈的區塊號與交易 Nonce（類似交易計數器）。
2. **balances** - 管理帳戶餘額，支援 **轉帳 (transfer)** 操作。
3. **proof_of_existence** - 提供 **內容存在證明**（類似 NFT 的概念），允許用戶 **註冊 (create_claim)** 和 **撤銷 (revoke_claim)** 內容所有權。
4. **support** - 定義了一些區塊與交易的基本結構，例如 `Block`、`Header`、`Extrinsic`，並提供 `Dispatch` trait，讓模組可以處理交易。
5. **types** - 定義基本型別，如 `AccountId`（帳戶 ID）、`Balance`（餘額）、`BlockNumber`（區塊編號）等。
6. **Runtime** - 負責整合 **system**、**balances** 和 **proof_of_existence** 模組，並模擬區塊鏈的執行環境。

---

## **🔹 1. system 模組**
**管理區塊鏈的區塊號 (Block Number) 與交易 Nonce**
```rust
pub trait Config {
    type AccountId: Ord + Clone;
    type BlockNumber: Zero + One + AddAssign + Copy;
    type Nonce: Zero + One + Copy;
}
```
- **BlockNumber**：記錄當前區塊號。
- **Nonce**：記錄帳戶的交易計數（防止重複交易）。
- **Pallet**：
  - `inc_block_number()` 讓區塊號 +1
  - `inc_nonce(who)` 讓某個帳戶的 Nonce +1

---

## **🔹 2. balances 模組**
**負責管理帳戶的餘額**
```rust
pub trait Config: crate::system::Config {
    type Balance: Zero + CheckedSub + CheckedAdd + Copy;
}
```
- `Pallet<T>` 內部用 `BTreeMap<T::AccountId, T::Balance>` 記錄帳戶餘額。
- `set_balance(who, amount)` 設定某個帳戶的餘額。
- `balance(who)` 取得帳戶餘額。
- **轉帳 (transfer)**：
  - 確保轉帳人餘額足夠 (`CheckedSub`)
  - 確保收款人不會溢位 (`CheckedAdd`)

```rust
pub fn transfer(
    &mut self,
    caller: T::AccountId,
    to: T::AccountId,
    amount: T::Balance,
) -> crate::support::DispatchResult {
    let caller_balance = self.balance(&caller);
    let new_caller_balance = caller_balance.checked_sub(&amount).ok_or("Not enough funds.")?;
    let new_to_balance = self.balance(&to).checked_add(&amount).ok_or("Overflow")?;
    
    self.balances.insert(caller, new_caller_balance);
    self.balances.insert(to, new_to_balance);
    
    Ok(())
}
```

---

## **🔹 3. proof_of_existence 模組**
**提供內容的所有權證明**
```rust
pub trait Config: crate::system::Config {
    type Content: Debug + Ord;
}
```
- `claims: BTreeMap<T::Content, T::AccountId>` 儲存內容與擁有者的對應關係。
- **`create_claim(caller, claim)`**：
  - 如果內容已存在，則返回錯誤 `this content is already claimed`。
  - 否則將 `claim` 記錄在 `claims` 中。
- **`revoke_claim(caller, claim)`**：
  - 如果內容不存在，則返回錯誤 `claim does not exist`。
  - 如果 `caller` 不是擁有者，則返回錯誤 `this content is owned by someone else`。

```rust
pub fn create_claim(
    &mut self,
    caller: T::AccountId,
    claim: T::Content,
) -> DispatchResult {
    if self.claims.contains_key(&claim) {
        return Err("this content is already claimed");
    }
    self.claims.insert(claim, caller);
    Ok(())
}
```

---

## **🔹 4. Runtime 模組**
整合 `system`、`balances` 和 `proof_of_existence`，並提供區塊執行功能。

```rust
impl crate::support::Dispatch for Runtime {
    type Caller = <Runtime as system::Config>::AccountId;
    type Call = RuntimeCall;
    fn dispatch(&mut self, caller: Self::Caller, runtime_call: Self::Call) -> support::DispatchResult {
        match runtime_call {
            RuntimeCall::Balances(call) => {
                self.balances.dispatch(caller, call)?;
            }
            RuntimeCall::ProofOfExistence(call) => {
                self.proof_of_existence.dispatch(caller, call)?;
            }
        }
        Ok(())
    }
}
```
- `dispatch(caller, call)`：根據交易類型，調用 `balances` 或 `proof_of_existence` 來執行。

---

## **🔹 5. 區塊鏈執行模擬**
模擬三個區塊：
1. **Block 1**
   - Alice 給 Bob 轉帳 30
   - Alice 給 Charlie 轉帳 20
2. **Block 2**
   - Alice 註冊 "Hello, world!" 的所有權
   - Bob 嘗試註冊相同的內容（會失敗）
3. **Block 3**
   - Alice 撤銷 "Hello, world!" 的所有權
   - Bob 再次註冊（成功）

```rust
let block_1 = types::Block {
    header: support::Header { block_number: 1 },
    extrinsics: vec![
        support::Extrinsic {
            caller: alice.clone(),
            call: RuntimeCall::Balances(balances::Call::transfer { to: bob.clone(), amount: 30 }),
        },
        support::Extrinsic {
            caller: alice.clone(),
            call: RuntimeCall::Balances(balances::Call::transfer { to: charlie, amount: 20 }),
        },
    ],
};

runtime.execute_block(block_1).expect("invalid block");
```

---

## **🔹 6. 結果輸出**
程式執行完畢後，`runtime` 會印出所有帳戶的最終狀態，包括餘額和內容所有權：

```
Runtime {
    system: Pallet { block_number: 3, nonce: { "alice": 3, "bob": 2 } },
    balances: Pallet { balances: { "alice": 50, "bob": 30 } },
    proof_of_existence: Pallet { claims: { "Hello, world!": "bob" } }
}
```
- **Alice 餘額剩 50**，因為轉出 50（30 給 Bob + 20 給 Charlie）。
- **Bob 餘額 30**，因為收到 30。
- **"Hello, world!" 的擁有者是 Bob**，因為 Alice 先撤銷了它，然後 Bob 註冊成功。

---

## **📌 總結**
✅ **區塊鏈模擬**：使用 Rust 建立簡單的區塊鏈運行時，支援 **轉帳** 和 **內容註冊**。  
✅ **狀態變更**：透過執行區塊來更新帳戶餘額與內容所有權。  
✅ **錯誤處理**：確保餘額足夠、處理內容所有權衝突。

這個架構類似 **Substrate**，是區塊鏈運行時的基本概念！🚀
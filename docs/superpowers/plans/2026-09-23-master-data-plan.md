# Data Master Terpadu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Data Master page for Produk, Kategori, Supplier, and Satuan, then reuse the shared product model in Kasir.

**Architecture:** Keep the first iteration client-side and aligned with the existing demo data so the UI can ship without inventing persistence. Extract domain types and seed data into focused master-data modules, expose CRUD state through the page, and adapt the existing POS product source to consume the shared product model. Persistence/database work remains a later plan.

**Tech Stack:** Next.js 16 App Router, React 19 client components, TypeScript, existing CSS in `app/globals.css`, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-23-master-data-design.md`

## Global Constraints

- SKU and product name are required.
- Prices and conversion factors cannot be negative; conversion factors must be positive.
- A base unit is required before derived units.
- Inactive products remain available for historical transactions but cannot be added to new sales.
- Permanent deletion is not used for records already referenced by transactions.
- Desktop uses dense tables; mobile/tablet uses touch-friendly cards and horizontally scrollable tabs.
- Existing Kasir behavior and completed transaction snapshots must remain unchanged.

## Review Focus

- Duplicate SKU: the product form must reject it without changing existing records.
- Zero or negative conversion factor: unit editor must show an error and block save.
- Product with no derived units: it must still use its base unit in Kasir.
- Inactive product: it must disappear from new Kasir results but remain in master data.
- Narrow viewport: tabs, cards, and forms must not create horizontal page overflow.

---

### Task 1: Extract shared product and master-data models

**Files:**
- Create: `components/master-data/master-data-types.ts`
- Modify: `components/pos/pos-types.ts`
- Modify: `components/pos/pos-demo-data.ts`

**Interfaces:**
- Produces `MasterProduct`, `ProductCategory`, `Supplier`, and `ProductUnit` types.
- Produces `masterCategories`, `masterSuppliers`, and `masterProducts` seed arrays.
- Existing POS `Product`, `CartLine`, and `formatRupiah` exports remain compatible.

- [ ] **Step 1: Add shared types and seed records**

Create types with required fields: `id`, `sku`, `name`, `categoryId`, `supplierId`, `baseUnit`, `units`, `purchasePrice`, `price`, `minimumStock`, and `active`. Use the existing demo product values as the initial product seed and map existing categories, suppliers, and units without changing visible Kasir copy.

- [ ] **Step 2: Adapt POS demo products to the shared source**

Keep `demoProducts` exported for current callers, but derive it from `masterProducts.filter((product) => product.active)` and map the shared fields into the existing `Product` shape. Preserve `product.units`, `unitLabel`, `price`, `availableStock`, and prescription/status fields.

- [ ] **Step 3: Run the build**

Run: `pnpm build`
Expected: PASS; existing Kasir and payment routes compile with the shared types.

- [ ] **Step 4: Commit**

```bash
git add components/master-data/master-data-types.ts components/pos/pos-types.ts components/pos/pos-demo-data.ts
git commit -m "refactor: share product master data types"
```

### Task 2: Build master-data page shell and tabs

**Files:**
- Create: `app/master-data/page.tsx`
- Create: `components/master-data/master-data-page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- `MasterDataPage` owns active tab and master-data state.
- `MasterDataTab` accepts `activeTab`, `onChange`, and four tab labels.
- Page route is `/master-data`.

- [ ] **Step 1: Build the page shell**

Add a server page that renders `MasterDataPage`, and a client component with heading “Data master”, a short operational description, a summary of active products, a primary “Tambah produk” button, and tabs for Produk, Kategori, Supplier, and Satuan.

- [ ] **Step 2: Add responsive layout styles**

Use the existing pharmacy POS palette and typography. Desktop uses a two-zone header and dense content; tablet and mobile use stacked header controls, horizontally scrollable tabs, and no fixed-width overflow.

- [ ] **Step 3: Verify navigation**

Open `/master-data` at 1387×665, 768×1024, and 304×600. Confirm the page loads, tabs are reachable, and no viewport has horizontal overflow.

- [ ] **Step 4: Commit**

```bash
git add app/master-data/page.tsx components/master-data/master-data-page.tsx app/globals.css
git commit -m "feat: add master data page shell"
```

### Task 3: Add Produk management

**Files:**
- Create: `components/master-data/product-panel.tsx`
- Create: `components/master-data/product-form.tsx`
- Modify: `components/master-data/master-data-page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- `ProductPanel` receives `products`, `categories`, `suppliers`, `onEdit`, and `onToggleActive`.
- `ProductForm` receives optional `product`, reference arrays, `onSave`, and `onCancel`.
- Save payload is `MasterProduct`.

- [ ] **Step 1: Render the product table/card list**

Implement search, category filter, active/inactive filter, product rows with SKU/name/category/supplier/stock/price/status, and edit/toggle actions. Switch to cards below 780px.

- [ ] **Step 2: Implement product form validation**

Validate required name and SKU, reject duplicate SKU except for the edited record, reject negative prices, require a base unit, require positive conversion factors, and require exactly one base unit. Display inline messages and keep the form open on failure.

- [ ] **Step 3: Implement unit editor**

Allow adding/removing derived units with label, conversion factor, and selling price. Include tablet, strip, box, botol, and vial as selectable labels but permit custom labels. Ensure base unit remains present.

- [ ] **Step 4: Wire create/edit/toggle state**

Update the in-memory product list immutably. Toggling active changes only `active`; editing retains the same `id`. Keep inactive products visible in the master list.

- [ ] **Step 5: Test failure cases and build**

Verify duplicate SKU and invalid conversion errors in the browser, then run `pnpm build`.

- [ ] **Step 6: Commit**

```bash
git add components/master-data/product-panel.tsx components/master-data/product-form.tsx components/master-data/master-data-page.tsx app/globals.css
git commit -m "feat: manage master products and units"
```

### Task 4: Add Kategori, Supplier, and Satuan management

**Files:**
- Create: `components/master-data/reference-panel.tsx`
- Modify: `components/master-data/master-data-page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- `ReferencePanel` accepts a discriminated reference type (`category`, `supplier`, or `unit`), records, and CRUD callbacks.
- Category and supplier records expose active toggles.
- Unit records expose label and conversion factor.

- [ ] **Step 1: Implement reusable reference list**

Render a table on desktop and cards on mobile/tablet for the active tab. Use labels suited to the reference: category name/product count, supplier name/contact/product count, or unit label/conversion factor.

- [ ] **Step 2: Add create/edit dialogs**

Use one compact form per reference type with required fields and inline validation. Prevent empty names and non-positive unit factors.

- [ ] **Step 3: Wire reference state**

Create, edit, and toggle records immutably in the page state. Do not allow deleting a category, supplier, or unit currently referenced by a product; show a clear message instead.

- [ ] **Step 4: Verify responsive references**

Check every tab at 304×600 and 768×1024. Confirm forms fit the viewport, tabs scroll horizontally, and controls remain keyboard accessible.

- [ ] **Step 5: Commit**

```bash
git add components/master-data/reference-panel.tsx components/master-data/master-data-page.tsx app/globals.css
git commit -m "feat: manage master data references"
```

### Task 5: Reconnect Kasir and validate end-to-end

**Files:**
- Modify: `components/pos/pos-workspace.tsx`
- Modify: `app/kasir/pembayaran/page.tsx`
- Modify: `components/pos/pos-demo-data.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Kasir consumes active `masterProducts` and the same `ProductUnit` values used by Data Master.
- Existing `updateUnit` behavior remains the single unit-selection path for Kasir and payment.

- [ ] **Step 1: Filter inactive master products from new sales**

Ensure product search and cards use only active products while existing cart lines remain renderable. Preserve product quantity limits based on selected conversion factors.

- [ ] **Step 2: Verify unit price propagation**

Select tablet, strip, and box in Kasir and payment. Confirm line price, subtotal, total, and maximum quantity update without changing completed transaction data.

- [ ] **Step 3: Verify end-to-end browser behavior**

Run the flow: create a product in Data Master, mark it active, find it in Kasir, add it, change its unit, navigate to payment, and change its unit again. Confirm labels and totals remain correct.

- [ ] **Step 4: Run final checks**

Run: `pnpm build`
Expected: PASS. Capture screenshots for `/master-data`, `/`, and `/kasir/pembayaran` at desktop, tablet, and mobile widths.

- [ ] **Step 5: Commit**

```bash
git add components/pos/pos-workspace.tsx app/kasir/pembayaran/page.tsx components/pos/pos-demo-data.ts app/globals.css
git commit -m "feat: connect master data to cashier"
```

### Task 6: Final review

**Files:**
- Modify: only files required by review findings.

- [ ] **Step 1: Review spec coverage**

Confirm all four tabs, product unit conversion, active filtering, responsive layouts, and cashier integration are implemented.

- [ ] **Step 2: Run final build and browser checks**

Run `pnpm build` and repeat the end-to-end browser flow at 1387×665, 768×1024, and 304×600.

- [ ] **Step 3: Commit fixes**

```bash
git add <reviewed-files>
git commit -m "fix: polish master data workflows"
```

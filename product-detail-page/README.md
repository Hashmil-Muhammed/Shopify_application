# Product Detail Page

A responsive e-commerce product detail page built with React,
TypeScript, Vite, and Tailwind CSS. Product information is loaded from
the supplied API.

## Setup and Run

**Requirements:** Node.js (LTS recommended) and npm.

1.  Open a terminal in the project folder.

2.  Install dependencies:

    ``` bash
    npm install
    ```

3.  Start the local development server:

    ``` bash
    npm run dev
    ```

4.  Open the local URL printed by Vite, usually `http://localhost:5173`.


## API Configuration

The app requests product data from the provided endpoint using the
required `x-vendor-id` header. During local development, the frontend
uses `/api/product` with a Vite proxy configured in `vite.config.ts` to
forward requests to the API. Restart Vite after changing the proxy
configuration.

The Vite development proxy does not run in a static production
deployment. For a deployed preview, configure an appropriate
server-side/serverless proxy or confirm that the API permits requests
from the deployed site through CORS.

## Component Structure

The implementation is organized in `src/App.tsx`:

-   **API and data helpers:** TypeScript types describe product data,
    variants, images, attributes, and specifications. Helper functions
    retrieve fields and format prices.
-   **Product fetching:** `useEffect` requests product data, includes
    the required vendor header, and handles loading, errors, and retry.
-   **Image gallery:** Uses image URLs from the API, supports thumbnail
    selection and previous/next navigation, and provides a fallback for
    failed images.
-   **Variant selection:** Builds size and color options from API
    variants and selects only combinations that exist in the response.
-   **Quantity and purchase validation:** Quantity starts at 1 and
    cannot be reduced below 1. Purchase is disabled when the selected
    variant is unavailable or stock is insufficient.
-   **Description and specifications:** Displays available API fields,
    omits empty specification values, and converts HTML tags in the
    description to readable text.
-   **Responsive UI:** Tailwind CSS responsive classes adapt the product
    layout for desktop, tablet, and mobile.

## Important Implementation Decisions

-   Product name, price, SKU, images, variants, stock, description, and
    specifications are derived from the API response rather than
    hardcoded.
-   Variant selection matches the actual size/color combination returned
    by the API; the app does not assume every combination exists.
-   Stock values are not fabricated. During development, the API
    returned `stock: 0` for the displayed variants, so the UI showed
    **Out of Stock** and disabled purchasing.
-   The assignment does not provide a cart API, so Add to Cart provides
    frontend feedback only when the selected variant is purchasable.
-   The website header and footer are excluded, as required by the
    assignment.



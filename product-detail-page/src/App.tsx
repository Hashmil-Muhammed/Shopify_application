

import { useEffect, useMemo, useState } from "react";

import {

  ChevronLeft,

  ChevronRight,

  Truck,

  ShieldCheck,

  RotateCcw,

  Minus,

  Plus,

  CheckCircle2,

  AlertCircle,

  LoaderCircle,

  ImageOff,

} from "lucide-react";



const API_URL = "/api/product";



const VENDOR_ID = "a9e3d24d-a2fe-4fbb-830f-91e0fee9f299";



type Specification = {

  id?: string;

  name: string;

  value: string | number | null;

};



type ProductImage = {

  id?: string;

  image: string;

  alt_text?: string | null;

};



type VariantAttribute = {

  id?: string;

  name: string;

  value: string;

};



type Variant = {

  id: string;

  sku?: string;

  price?: number | string;

  actual_price?: number | string;

  stock?: number | string;

  attributes?: VariantAttribute[];

  images?: ProductImage[];

  is_primary?: boolean;

};



type Product = {

  id: string;

  name?: string;

  title?: string;

  slug?: string;

  description?: string;

  specifications?: Specification[];

  variants?: Variant[];

  product_images?: ProductImage[];

  is_active?: boolean;

  is_deleted?: boolean;

  is_next_day_shipping_available?: boolean;

  product_category?: string;

};



type ApiResponse = {

  status: string;

  message?: string;

  data: Product;

};



function attribute(variant: Variant | undefined, name: string) {

  return variant?.attributes?.find(

    (item) => item.name.toLowerCase() === name.toLowerCase()

  )?.value;

}



function specValue(product: Product | null, name: string) {

  return product?.specifications?.find(

    (item) => item.name.toLowerCase() === name.toLowerCase()

  )?.value;

}



function getProductName(product: Product) {

  const titleTag = specValue(product, "global.title_tag");

  const title = String(titleTag ?? "").trim();



  if (product.name?.trim()) return product.name;

  if (product.title?.trim()) return product.title;



  // Remove the SEO suffix from titles such as "Product | Brand".

  if (title) return title.split("|")[0].trim();



  return "Product Details";

}



function getProductDescription(product: Product) {
  const descriptionTag = specValue(product, "global.description_tag");
  const rawDescription = String(product.description || descriptionTag || "");

  // Convert common HTML markup to readable text without displaying HTML tags.
  return rawDescription
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function specificationLabel(name: string) {

  const labels: Record<string, string> = {

    "custom.product_code": "Product Code",

    "custom.product_weight": "Product Weight",

    "custom.metal_weight": "Metal Weight",

    "custom.total_metal_price": "Total Metal Price",

    "custom.total_making_charges": "Total Making Charges",

    "custom.gst": "GST",

    "custom.total_price": "Total Price",

    "custom.stone_price": "Stone Price",

    "custom.total_no_of_stones": "Total Number of Stones",

    "custom.total_stone_weight_gram": "Total Stone Weight (g)",

    "custom.total_stone_weight_carat": "Total Stone Weight (carat)",

  };



  return labels[name] ?? null;

}



function formatPrice(value: number | string | undefined) {

  const amount = Number(value);



  if (!Number.isFinite(amount)) return "Price unavailable";



  return new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  }).format(amount);

}



function App() {

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [retry, setRetry] = useState(0);

  const [selectedVariantId, setSelectedVariantId] = useState("");

  const [selectedImage, setSelectedImage] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const [cartMessage, setCartMessage] = useState("");

  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"responsive" | "desktop" | "mobile">("responsive");



  useEffect(() => {

    const controller = new AbortController();



    async function fetchProduct() {

      setLoading(true);

      setError("");



      try {

        const response = await fetch(API_URL, {

          method: "GET",

          headers: {

            "x-vendor-id": VENDOR_ID,

            Accept: "application/json",

          },

          signal: controller.signal,

        });



        if (!response.ok) {

          throw new Error(

            `Product request failed (${response.status}). Check the API and vendor ID.`

          );

        }



        const result: ApiResponse = await response.json();



        if (

          result.status !== "success" ||

          !result.data ||

          !Array.isArray(result.data.variants)

        ) {

          throw new Error(

            result.message || "The API returned an invalid product response."

          );

        }



        const item = result.data;

        setProduct(item);



        const primary =

          item.variants.find((variant) => variant.is_primary) ??

          item.variants[0];



        setSelectedVariantId(primary?.id ?? "");

        setSelectedImage(0);

        setQuantity(1);

        setFailedImages([]);

      } catch (err) {

        if (err instanceof Error && err.name === "AbortError") return;



        setError(

          err instanceof Error

            ? err.message

            : "Unable to load product details."

        );

      } finally {

        if (!controller.signal.aborted) setLoading(false);

      }

    }



    fetchProduct();



    return () => controller.abort();

  }, [retry]);



  const selectedVariant = useMemo(

    () =>

      product?.variants?.find(

        (variant) => variant.id === selectedVariantId

      ),

    [product, selectedVariantId]

  );



  const productName = product ? getProductName(product) : "Product Details";



  const gallery = useMemo(() => {

    if (!product) return [];



    const images = [

      ...(selectedVariant?.images ?? []),

      ...(product.product_images ?? []),

    ];



    const uniqueImages = new Map<string, ProductImage>();



    images.forEach((image) => {

      if (image.image && !uniqueImages.has(image.image)) {

        uniqueImages.set(image.image, image);

      }

    });



    return Array.from(uniqueImages.values());

  }, [product, selectedVariant]);



  const sizes = useMemo(() => {

    const values = (product?.variants ?? [])

      .map((variant) => attribute(variant, "Size"))

      .filter((value): value is string => Boolean(value));



    return [...new Set(values)].sort(

      (a, b) => Number(a) - Number(b)

    );

  }, [product]);



  const colors = useMemo(() => {

    const values = (product?.variants ?? [])

      .map((variant) => attribute(variant, "Color"))

      .filter((value): value is string => Boolean(value));



    return [...new Set(values)];

  }, [product]);



  const selectedSize = attribute(selectedVariant, "Size");

  const selectedColor = attribute(selectedVariant, "Color");



  const stock = Math.max(0, Number(selectedVariant?.stock ?? 0));

  const price = selectedVariant?.price;

  const actualPrice = selectedVariant?.actual_price;



  const canPurchase =

    Boolean(selectedVariant) &&

    product?.is_active !== false &&

    product?.is_deleted !== true &&

    stock >= quantity;



  function chooseVariant(size: string, color: string) {

    if (!product?.variants) return;



    const matching = product.variants.find(

      (variant) =>

        attribute(variant, "Size") === size &&

        attribute(variant, "Color") === color

    );



    if (!matching) return;



    setSelectedVariantId(matching.id);

    setSelectedImage(0);

    setQuantity(1);

    setCartMessage("");

  }



  function sizeIsAvailable(size: string) {

    return Boolean(

      product?.variants?.some(

        (variant) =>

          attribute(variant, "Size") === size &&

          (!selectedColor ||

            attribute(variant, "Color") === selectedColor) &&

          Number(variant.stock ?? 0) > 0

      )

    );

  }



  function colorIsAvailable(color: string) {

    return Boolean(

      product?.variants?.some(

        (variant) =>

          attribute(variant, "Color") === color &&

          (!selectedSize ||

            attribute(variant, "Size") === selectedSize) &&

          Number(variant.stock ?? 0) > 0

      )

    );

  }



  function addToCart() {

    if (!selectedVariant || !canPurchase) {

      setCartMessage("This variant is currently out of stock.");

      return;

    }



    // The assignment does not provide a cart API.

    setCartMessage(

      `${quantity} item${quantity > 1 ? "s" : ""} added successfully.`

    );

  }



  const specs = useMemo(

    () =>

      (product?.specifications ?? [])

        .map((spec) => ({

          label: specificationLabel(spec.name),

          value: spec.value,

        }))

        .filter(

          (spec): spec is { label: string; value: string | number } =>

            Boolean(spec.label) &&

            spec.value !== null &&

            spec.value !== undefined &&

            String(spec.value).trim() !== ""

        ),

    [product]

  );



  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-white px-4">

        <div className="flex flex-col items-center gap-3 text-stone-600">

          <LoaderCircle className="h-8 w-8 animate-spin" />

          <p className="text-sm">Loading product details...</p>

        </div>

      </main>

    );

  }



  if (error || !product) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6">

        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">

          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />

          <h1 className="text-xl font-semibold text-stone-900">

            Unable to load product

          </h1>

          <p className="mt-2 break-words text-sm text-stone-600">

            {error || "No product data was returned."}

          </p>

          <button

            onClick={() => setRetry((current) => current + 1)}

            className="mt-5 rounded-lg bg-stone-900 px-5 py-3 text-sm font-medium text-white"

          >

            Try again

          </button>

        </div>

      </main>

    );

  }



  const mainImage = gallery[selectedImage];

  const isSoldOut = !canPurchase;

  const description = getProductDescription(product);



  return (
    <div className="min-h-screen bg-stone-100">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 border-b border-stone-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur">
        {/* <span className="mr-1 text-xs font-medium text-stone-500 sm:text-sm">Preview:</span> */}
        {/* <button type="button" onClick={() => setViewMode("responsive")} aria-pressed={viewMode === "responsive"} className={`rounded-lg border px-3 py-2 text-xs font-medium transition sm:text-sm ${viewMode === "responsive" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}>Responsive</button> */}
        <button type="button" onClick={() => setViewMode("desktop")} aria-pressed={viewMode === "desktop"} className={`rounded-lg border px-3 py-2 text-xs font-medium transition sm:text-sm ${viewMode === "desktop" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}>Desktop View</button>
        <button type="button" onClick={() => setViewMode("mobile")} aria-pressed={viewMode === "mobile"} className={`rounded-lg border px-3 py-2 text-xs font-medium transition sm:text-sm ${viewMode === "mobile" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}>Mobile View</button>
      </div>
      <main className={`min-h-screen bg-white text-stone-900 transition-all duration-200 ${viewMode === "mobile" ? "mx-auto w-full max-w-[390px] shadow-xl" : viewMode === "desktop" ? "mx-auto w-full max-w-[1440px]" : "w-full"}`}>
      <div className={`mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-8 ${viewMode === "mobile" ? "!px-3" : ""}`}>

        <nav

          aria-label="Breadcrumb"

          className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-stone-500 sm:mb-5 sm:text-xs"

        >

          <span>Home</span>

          <ChevronRight className="h-3 w-3" />

          <span>Products</span>

          <ChevronRight className="h-3 w-3" />

          <span className="max-w-[220px] truncate text-stone-900">

            {productName}

          </span>

        </nav>



        <section className={`grid grid-cols-1 gap-5 sm:gap-7 ${viewMode === "mobile" ? "!grid-cols-1 !gap-5" : viewMode === "desktop" ? "lg:grid-cols-2 lg:gap-10" : "lg:grid-cols-2 lg:gap-10"}`}>

          <div className="min-w-0">

            <div className="group relative flex aspect-square max-h-[650px] w-full items-center justify-center overflow-hidden rounded-xl bg-stone-100 sm:rounded-2xl">

              {mainImage && !failedImages.includes(mainImage.image) ? (

                <img

                  src={mainImage.image}

                  alt={mainImage.alt_text || productName}

                  className="h-full w-full object-contain p-5 sm:p-8"

                  onError={() =>

                    setFailedImages((current) =>

                      current.includes(mainImage.image)

                        ? current

                        : [...current, mainImage.image]

                    )

                  }

                />

              ) : (

                <div className="flex flex-col items-center gap-2 text-stone-400">

                  <ImageOff className="h-12 w-12" />

                  <span className="text-sm">

                    {gallery.length ? "Image unavailable" : "No product images available"}

                  </span>

                </div>

              )}



              {gallery.length > 1 && (

                <>

                  <button

                    aria-label="Previous image"

                    onClick={() =>

                      setSelectedImage(

                        (current) =>

                          (current - 1 + gallery.length) % gallery.length

                      )

                    }

                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 shadow-sm hover:bg-white sm:left-4"

                  >

                    <ChevronLeft className="h-5 w-5" />

                  </button>

                  <button

                    aria-label="Next image"

                    onClick={() =>

                      setSelectedImage((current) => (current + 1) % gallery.length)

                    }

                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white/95 shadow-sm hover:bg-white sm:right-4"

                  >

                    <ChevronRight className="h-5 w-5" />

                  </button>

                </>

              )}

            </div>



            {gallery.length > 0 && (

              <div className={`mt-2 grid grid-cols-4 gap-2 sm:mt-4 sm:gap-3 ${viewMode === "mobile" ? "!gap-2" : ""}`}>

                {gallery.map((image, index) => (

                  <button

                    key={image.id || image.image}

                    onClick={() => setSelectedImage(index)}

                    aria-label={`View product image ${index + 1}`}

                    aria-pressed={selectedImage === index}

                    className={`aspect-square overflow-hidden rounded-lg border-2 bg-stone-50 p-1 transition sm:p-2 ${

                      selectedImage === index

                        ? "border-stone-800"

                        : "border-stone-200 hover:border-stone-400"

                    }`}

                  >

                    {!failedImages.includes(image.image) ? (

                      <img

                        src={image.image}

                        alt={image.alt_text || `${productName} view ${index + 1}`}

                        className="h-full w-full object-contain"

                        onError={() =>

                          setFailedImages((current) =>

                            current.includes(image.image)

                              ? current

                              : [...current, image.image]

                          )

                        }

                      />

                    ) : (

                      <ImageOff className="mx-auto h-6 w-6 text-stone-400" />

                    )}

                  </button>

                ))}

              </div>

            )}

          </div>



          <div className="min-w-0 lg:pt-1">

            <div

              className={`mb-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${

                isSoldOut

                  ? "bg-red-50 text-red-700"

                  : "bg-emerald-50 text-emerald-700"

              }`}

            >

              {isSoldOut ? (

                <AlertCircle className="h-3.5 w-3.5" />

              ) : (

                <CheckCircle2 className="h-3.5 w-3.5" />

              )}

              {isSoldOut ? "Out of Stock" : "In Stock"}

            </div>



            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">

              {productName}

            </h1>



            <p className="mt-1 text-xs text-stone-500">

              SKU: {selectedVariant?.sku || "Not provided"}

            </p>



            <div className="mt-3 border-b border-stone-200 pb-4 sm:mt-4 sm:pb-5">

              <p className="text-2xl font-bold tracking-tight sm:text-3xl">

                {price !== undefined ? formatPrice(price) : "Price unavailable"}

              </p>

              {selectedVariant && actualPrice !== undefined && (

                <p className="mt-1 text-xs text-stone-500">

                  {Number(actualPrice) !== Number(price)

                    ? `Actual price: ${formatPrice(actualPrice)}`

                    : "Price inclusive of available charges"}

                </p>

              )}

            </div>



            {sizes.length > 0 && (

              <div className="mt-5">

                <div className="mb-2 flex items-center justify-between">

                  <h2 className="text-sm font-semibold">Size</h2>

                  <span className="text-xs text-stone-500">

                    {selectedSize ? `Selected: ${selectedSize}` : "Choose a size"}

                  </span>

                </div>

                <div className={`grid grid-cols-4 gap-2 ${viewMode === "mobile" ? "!grid-cols-5" : "min-[380px]:grid-cols-5 sm:grid-cols-6 xl:grid-cols-9"}`}>

                  {sizes.map((size) => {

                    const available = sizeIsAvailable(size);

                    const active = selectedSize === size;



                    return (

                      <button

                        key={size}

                        disabled={!available}

                        onClick={() =>

                          selectedColor && chooseVariant(size, selectedColor)

                        }

                        aria-pressed={active}

                        title={available ? `Size ${size}` : `Size ${size} unavailable`}

                        className={`relative flex min-h-10 items-center justify-center rounded-md border px-2 py-2 text-sm transition ${

                          active

                            ? "border-stone-900 bg-stone-900 font-semibold text-white"

                            : "border-stone-200 bg-white text-stone-700"

                        } ${

                          !available

                            ? "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"

                            : "hover:border-stone-700"

                        }`}

                      >

                        {size}

                        {!available && (

                          <span className="pointer-events-none absolute inset-x-1/2 top-1/2 h-px w-[115%] -translate-x-1/2 -translate-y-1/2 rotate-[-35deg] bg-stone-200" />

                        )}

                      </button>

                    );

                  })}

                </div>

              </div>

            )}



            {colors.length > 0 && (

              <div className="mt-5">

                <h2 className="mb-2 text-sm font-semibold">Color</h2>

                <div className="flex flex-wrap gap-2">

                  {colors.map((color) => {

                    const active = selectedColor === color;

                    const available = colorIsAvailable(color);

                    const swatch = color.toLowerCase().includes("rose")

                      ? "bg-[#d9a08f]"

                      : color.toLowerCase().includes("yellow")

                        ? "bg-[#d7ad43]"

                        : "bg-stone-300";



                    return (

                      <button

                        key={color}

                        disabled={!available}

                        onClick={() =>

                          selectedSize && chooseVariant(selectedSize, color)

                        }

                        aria-pressed={active}

                        className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs transition sm:text-sm ${

                          active

                            ? "border-stone-900 bg-stone-50 ring-1 ring-stone-900"

                            : "border-stone-200"

                        } ${

                          !available

                            ? "cursor-not-allowed opacity-50"

                            : "hover:border-stone-500"

                        }`}

                      >

                        <span

                          className={`h-4 w-4 rounded-full border border-black/10 ${swatch}`}

                        />

                        {color}

                      </button>

                    );

                  })}

                </div>

              </div>

            )}



            <div className="mt-5">

              <h2 className="mb-2 text-sm font-semibold">Quantity</h2>

              <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-stone-200">

                <button

                  aria-label="Decrease quantity"

                  disabled={quantity <= 1}

                  onClick={() =>

                    setQuantity((current) => Math.max(1, current - 1))

                  }

                  className="flex h-full w-10 items-center justify-center hover:bg-stone-50 disabled:opacity-40"

                >

                  <Minus className="h-4 w-4" />

                </button>

                <span className="flex h-full min-w-12 items-center justify-center border-x border-stone-200 px-3 text-sm">

                  {quantity}

                </span>

                <button

                  aria-label="Increase quantity"

                  disabled={!selectedVariant || quantity >= stock}

                  onClick={() =>

                    setQuantity((current) => Math.min(stock, current + 1))

                  }

                  className="flex h-full w-10 items-center justify-center hover:bg-stone-50 disabled:opacity-40"

                >

                  <Plus className="h-4 w-4" />

                </button>

              </div>

            </div>



            <button

              disabled={!canPurchase}

              onClick={addToCart}

              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"

            >

              {isSoldOut ? "Currently Unavailable" : "Add to Cart"}

            </button>



            {cartMessage && (

              <p

                role="status"

                className={`mt-3 rounded-lg p-3 text-sm ${

                  canPurchase

                    ? "bg-emerald-50 text-emerald-800"

                    : "bg-red-50 text-red-700"

                }`}

              >

                {cartMessage}

              </p>

            )}



            <div className="mt-4 grid grid-cols-1 gap-3 border-b border-stone-200 pb-4 sm:mt-5 sm:pb-5 lg:grid-cols-3">

              <div className="flex items-center gap-2 text-xs text-stone-600">

                <Truck className="h-5 w-5 shrink-0" />

                <span>

                  {product.is_next_day_shipping_available

                    ? "Next-day shipping available"

                    : "Shipping details available at checkout"}

                </span>

              </div>

              <div className="flex items-center gap-2 text-xs text-stone-600">

                <ShieldCheck className="h-5 w-5 shrink-0" />

                <span>Product details from the supplier</span>

              </div>

              <div className="flex items-center gap-2 text-xs text-stone-600">

                <RotateCcw className="h-5 w-5 shrink-0" />

                <span>Check return policy before ordering</span>

              </div>

            </div>

          </div>

        </section>



        <section className="mt-6 border-b border-stone-200 py-5 sm:mt-8 sm:py-6 lg:mt-10">

          <h2 className="text-lg font-semibold">Description</h2>

          <p className="mt-4 max-w-5xl whitespace-pre-line text-sm leading-7 text-stone-600">

            {description || "No description provided."}

          </p>

        </section>



        {specs.length > 0 && (

          <section className="py-5 sm:py-8">

            <h2 className="text-lg font-semibold">Specifications</h2>

            <dl className={`mt-4 grid grid-cols-1 overflow-hidden rounded-lg border border-stone-200 ${viewMode === "mobile" ? "!grid-cols-1" : "sm:grid-cols-2"}`}>

              {specs.map((spec, index) => {

                const value = String(spec.value);

                const isWeight = spec.label.toLowerCase().includes("weight");

                const isPrice =

                  spec.label.toLowerCase().includes("price") ||

                  spec.label.toLowerCase().includes("charges") ||

                  spec.label === "GST";



                return (

                  <div

                    key={spec.label}

                    className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-stone-100 px-4 py-3 text-sm ${

                      index % 4 < 2 ? "bg-stone-50" : "bg-white"

                    }`}

                  >

                    <dt className="break-words text-stone-600">

                      {spec.label}

                    </dt>

                    <dd className="break-words font-medium text-stone-900">

                      {isWeight

                        ? spec.label.toLowerCase().includes("carat")

                          ? `${value} ct`

                          : spec.label.includes("(g)")

                            ? value

                            : `${value} g`

                        : isPrice

                          ? formatPrice(value)

                          : value}

                    </dd>

                  </div>

                );

              })}

            </dl>

          </section>

        )}

      </div>
      </main>
    </div>
  );

}



export default App;

function getWishlist() {
    return JSON.parse(localStorage.getItem("wishlist")) || [];
}
function saveWishlist(list) {
    localStorage.setItem("wishlist", JSON.stringify(list));
}

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? "block" : "none";

        badge.classList.remove('shake');
        void badge.offsetWidth; 
        badge.classList.add('shake');
    }
}

function renderRecommendations() {
    const container = document.getElementById("recommendationsContainer");
    if (!container) return;

    const lang = localStorage.getItem("language") || "en";
    const wishlist = getWishlist();
    const products = (typeof SHIZUKU_PRODUCTS !== 'undefined' ? SHIZUKU_PRODUCTS : []);
    const available = products.filter(p => !wishlist.some(w => w.title === p.title));
    const selected = available.sort(() => 0.5 - Math.random()).slice(0, 3);

    const user = (typeof QuickView !== 'undefined') ? QuickView.getLoggedInUser() : null;
    const tier = user ? QuickView.getCurrentTier(QuickView.getLifetimePoints(user)) : null;
    const isBlossomPlus = user && tier && tier.name !== "Sprout";

    const hasQuickView = typeof calculateAverageRating === 'function' && typeof renderStars === 'function';

    container.innerHTML = selected.map(item => {
        const isSeasonal = item.title.includes("Sakura") || item.roast === "flavored" || item.title.includes("桜");
        const isAccessory = item.roast === 'accessory';
        
        let disc = 0;
        if (tier?.name === 'Sakura') {
            disc = isAccessory ? 20 : 10;
        } else {
            if (isAccessory && tier?.name === 'Petal') disc = 10;
            else if (isSeasonal && isBlossomPlus) disc = 5;
        }

        const discountBadge = disc > 0 ? `<span class="badge bg-success ms-1" style="font-size: 10px;">${disc}% OFF</span>` : '';
        const isDiscounted = disc > 0;
        const displayPrice = isDiscounted 
            ? `<span class="text-decoration-line-through opacity-50 me-2" style="font-size: 0.85em;">${formatPrice(item.price)}</span><span class="fw-bold" style="color: var(--sakura-pink-dark);">${formatPrice(item.price * (1 - disc/100))}</span>`
            : formatPrice(item.price);

        return `
        <div class="wishlist-card" data-title="${item.title}" style="cursor:pointer;">
            <img src="${item.img}">
            <h3>${lang === 'jp' ? (item.title_jp || item.title) : item.title}${discountBadge}</h3>
            <p>${lang === 'jp' ? (item.tagline_jp || item.tagline) : item.tagline}</p>
            <div class="mb-2">
                <div class="product-rating-summary" style="justify-content: center;">
                    ${hasQuickView ? renderStars(calculateAverageRating(item.title)) : ''}
                    <span style="font-size: 11px; opacity: 0.8;">(${typeof getReviewsForProduct === 'function' ? (getReviewsForProduct(item.title).length + (QuickView?.reviewsPool?.filter(r => r.productTitle === item.title).length || 0)) : 0})</span>
                </div>
            </div>
            <p class="price">${displayPrice}</p>
            <div class="wishlist-actions">
                <button class="sakura-btn add-btn" data-title="${item.title}">${lang === 'jp' ? 'カートに入れる' : 'Add to Cart'}</button>
            </div>
        </div>`;
    }).join("");
}

function renderWishlist() {
    renderRecommendations();

    const container = document.getElementById("wishlistContainer");
    if (!container) return; 

    const wishlist = getWishlist();
    const lang = localStorage.getItem("language") || "en";

    const hasQuickView = typeof calculateAverageRating === 'function' && typeof renderStars === 'function';

    const user = (typeof QuickView !== 'undefined') ? QuickView.getLoggedInUser() : null;
    const tier = user ? QuickView.getCurrentTier(QuickView.getLifetimePoints(user)) : null;
    const isBlossomPlus = user && tier && tier.name !== "Sprout";

    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <img src="empty.png" class="empty-img">
                <p class="empty-text">${lang === 'jp' ? 'ウィッシュリストが空です 🌸' : 'Your wishlist is empty 🌸'}</p>
            </div>
        `;
    } else {
    container.innerHTML = wishlist.map(item => {
        const isSeasonal = item.title.includes("Sakura") || item.roast === "flavored" || item.title.includes("桜");
        const isAccessory = item.roast === 'accessory';

        let disc = 0;
        if (tier?.name === 'Sakura') {
            disc = isAccessory ? 20 : 10;
        } else {
            if (isAccessory && tier?.name === 'Petal') disc = 10;
            else if (isSeasonal && isBlossomPlus) disc = 5;
        }

        const discountBadge = disc > 0 ? `<span class="badge bg-success ms-1" style="font-size: 10px;">${disc}% OFF</span>` : '';
        const isDiscounted = disc > 0;
        const displayPrice = isDiscounted 
            ? `<span class="text-decoration-line-through opacity-50 me-2" style="font-size: 0.85em;">${formatPrice(item.price)}</span><span class="fw-bold" style="color: var(--sakura-pink-dark);">${formatPrice(item.price * (1 - disc/100))}</span>`
            : formatPrice(item.price);

        return `
        <div class="wishlist-card" data-title="${item.title}">
            <h3>${lang === 'jp' ? (item.title_jp || item.title) : item.title}${discountBadge}</h3>
            <p>${lang === 'jp' ? (item.tagline_jp || item.tagline) : item.tagline}</p>
            <div class="mb-2">
                <div class="product-rating-summary" style="justify-content: center;">
                    ${hasQuickView ? renderStars(calculateAverageRating(item.title)) : ''}
                    <span style="font-size: 11px; opacity: 0.8;">(${typeof getReviewsForProduct === 'function' ? (getReviewsForProduct(item.title).length + (QuickView?.reviewsPool?.filter(r => r.productTitle === item.title).length || 0)) : 0})</span>
                </div>
            </div>
            <p class="price">${displayPrice}</p>
            
            <div class="wishlist-actions">
                <button class="sakura-btn add-btn" data-title="${item.title}">${lang === 'jp' ? 'カートに入れる' : 'Add to Cart'}</button>
                <button class="remove-btn" data-title="${item.title}">${lang === 'jp' ? '削除' : 'Remove'}</button>
            </div>
        </div>`;
    }).join("");
    }

    container.querySelectorAll(".wishlist-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            const title = card.getAttribute('data-title');
            if (title) QuickView.showByName(title);
        });
    });

    document.querySelectorAll(".add-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (typeof SHIZUKU_PRODUCTS === 'undefined') return;
            
            const item = SHIZUKU_PRODUCTS.find(i => i.title === btn.dataset.title);

            let cart = getCart();
            const existing = cart.find(i => i.title === item.title);

            if (existing) {
                existing.qty += 1;
            } else {
                cart.push({ ...item, qty: 1 });
            }

            saveCart(cart);

            const lang = localStorage.getItem("language") || "en";
            const productName = lang === 'jp' ? (item.title_jp || item.title) : item.title;
            const msg = `<span style="font-weight:600; color: var(--sakura-pink-main);">${productName}</span> ` + 
                        (lang === 'jp' ? 'がカートに追加されました！' : 'has been added to your cart!');
            
            if (window.showSakuraToast) {
                window.showSakuraToast(msg, '🛒');
            }
        });
    });

    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".wishlist-card");
            if (card) card.classList.add("removing");
            setTimeout(() => {
                let wishlist = getWishlist();
                wishlist = wishlist.filter(i => i.title !== btn.dataset.title);
                saveWishlist(wishlist);
                renderWishlist();
            }, 400);
        });
    });
}

renderWishlist();

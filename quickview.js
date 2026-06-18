function getProductReviews() {
    return JSON.parse(localStorage.getItem('productReviews') || '{}');
}

function saveProductReviews(reviews) {
    localStorage.setItem('productReviews', JSON.stringify(reviews));
}

function getReviewsForProduct(productTitle) {
    const allReviews = getProductReviews();
    return allReviews[productTitle] || [];
}

function addReviewForProduct(productTitle, review) {
    const allReviews = getProductReviews();
    if (!allReviews[productTitle]) {
        allReviews[productTitle] = [];
    }
    allReviews[productTitle].push(review);
    saveProductReviews(allReviews);
}

function calculateAverageRating(productTitle) {
    const reviews = getReviewsForProduct(productTitle);
    if (typeof QuickView === 'undefined' || !QuickView.reviewsPool) return 0;
    const poolReviews = QuickView.reviewsPool.filter(r => r.productTitle === productTitle);
    const poolNames = new Set(poolReviews.map(r => r.name));
    const uniqueLocalReviews = reviews.filter(r => !poolNames.has(r.name));
    const allReviews = [...poolReviews, ...uniqueLocalReviews];
    if (allReviews.length === 0) return 0;
    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return totalRating / allReviews.length;
}

window.showSakuraToast = function(message, icon = '🌸', action = null) {
    let toastEl = document.getElementById('shizukuToast');
    if (!toastEl) {
        const html = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 5000;">
                <div id="shizukuToast" class="toast sakura-toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <span class="me-2" id="shizukuToastIcon">🌸</span>
                        <strong class="me-auto">Shizuku Coffee</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body" id="shizukuToastBody"></div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        toastEl = document.getElementById('shizukuToast');
    }

    const toastBody = document.getElementById('shizukuToastBody');
    const toastIcon = document.getElementById('shizukuToastIcon');
    if (!toastBody) return;

    const processedMessage = message.replace(/\[\[\s*(.*?)\s*\]\]/g, (match, name) => {
        const escapedName = name.trim().replace(/'/g, "\\'");
        return `<span style="text-decoration: underline; cursor: pointer; font-weight: 600; color: var(--sakura-pink-dark);" onclick="QuickView.showByName('${escapedName}')">${name.trim()}</span>`;
    });

    toastBody.innerHTML = processedMessage;
    if (toastIcon) toastIcon.innerText = icon;

    if (action && action.text && action.callback) {
        const btnId = 'toastActionBtn_' + Math.floor(Math.random() * 1000000);
        toastBody.innerHTML += `<div class="mt-2 pt-2 border-top text-end">
            <button type="button" id="${btnId}" class="btn btn-sm sakura-btn sakura-btn-subtle" style="font-size: 11px; padding: 4px 12px; width: auto; margin: 0;">${action.text}</button>
        </div>`;
        
        setTimeout(() => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.onclick = () => {
                    action.callback();
                    bootstrap.Toast.getInstance(toastEl).hide();
                };
            }
        }, 0);
    }
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        new bootstrap.Toast(toastEl, { delay: 4000 }).show();
    } else {
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 4000);
    }
};

window.alert = (msg) => window.showSakuraToast(msg);

function renderStars(rating) {
    const percentage = (rating / 5) * 100;
    return `
        <div class="star-display" style="--rating-width: ${percentage}%;">
            <span></span>
        </div>
    `;
}

function getHelpfulCounts() {
    return JSON.parse(localStorage.getItem('reviewHelpfulCounts') || '{}');
}

function saveHelpfulCount(productTitle, reviewerName) {
    const counts = getHelpfulCounts();
    const userVotes = JSON.parse(localStorage.getItem('shizuku_user_votes') || '{}');
    const key = `${productTitle}_${reviewerName}`;
    
    if (userVotes[key]) {
        delete userVotes[key];
        counts[key] = Math.max(0, (counts[key] || 1) - 1);
    } else {
        userVotes[key] = true;
        counts[key] = (counts[key] || 0) + 1;
    }
    
    localStorage.setItem('reviewHelpfulCounts', JSON.stringify(counts));
    localStorage.setItem('shizuku_user_votes', JSON.stringify(userVotes));
}

const QuickView = {
    initialized: false,
    bsModal: null,
    currentProduct: null,
    currentQty: 1,
    chatHistory: [],
    reviewFilter: null,
    flagData: [
        { name: "Afghanistan", flag: "🇦🇫" }, { name: "Armenia", flag: "🇦🇲" }, { name: "Azerbaijan", flag: "🇦🇿" }, { name: "Bahrain", flag: "🇧🇭" }, { name: "Bangladesh", flag: "🇧🇩" }, { name: "Bhutan", flag: "🇧🇹" }, { name: "Brunei", flag: "🇧🇳" }, { name: "Cambodia", flag: "🇰🇭" }, { name: "China", flag: "🇨🇳" }, { name: "Georgia", flag: "🇬🇪" }, { name: "India", flag: "🇮🇳" }, { name: "Indonesia", flag: "🇮🇩" }, { name: "Iran", flag: "🇮🇷" }, { name: "Iraq", flag: "🇮🇶" }, { name: "Israel", flag: "🇮🇱" }, { name: "Japan", flag: "🇯🇵" }, { name: "Jordan", flag: "🇯🇴" }, { name: "Kazakhstan", flag: "🇰🇿" }, { name: "Kuwait", flag: "🇰🇼" }, { name: "Kyrgyzstan", flag: "🇰🇬" }, { name: "Laos", flag: "🇱🇦" }, { name: "Lebanon", flag: "🇱🇧" }, { name: "Malaysia", flag: "🇲🇾" }, { name: "Maldives", flag: "🇲🇻" }, { name: "Mongolia", flag: "🇲🇳" }, { name: "Myanmar", flag: "🇲🇲" }, { name: "Nepal", flag: "🇳🇵" }, { name: "North Korea", flag: "🇰🇵" }, { name: "Oman", flag: "🇴🇲" }, { name: "Pakistan", flag: "🇵🇰" }, { name: "Palestine", flag: "🇵🇸" }, { name: "Philippines", flag: "🇵🇭" }, { name: "Qatar", flag: "🇶🇦" }, { name: "Saudi Arabia", flag: "🇸🇦" }, { name: "Singapore", flag: "🇸🇬" }, { name: "South Korea", flag: "🇰🇷" }, { name: "Sri Lanka", flag: "🇱🇰" }, { name: "Syria", flag: "🇸🇾" }, { name: "Taiwan", flag: "🇹🇼" }, { name: "Tajikistan", flag: "🇹🇯" }, { name: "Thailand", flag: "🇹🇭" }, { name: "Timor-Leste", flag: "🇹🇱" }, { name: "Turkey", flag: "🇹🇷" }, { name: "Turkmenistan", flag: "🇹🇲" }, { name: "UAE", flag: "🇦🇪" }, { name: "Uzbekistan", flag: "🇺🇿" }, { name: "Vietnam", flag: "🇻🇳" }, { name: "Yemen", flag: "🇾🇪" },
        { name: "Albania", flag: "🇦🇱" }, { name: "Andorra", flag: "🇦🇩" }, { name: "Austria", flag: "🇦🇹" }, { name: "Belarus", flag: "🇧🇾" }, { name: "Belgium", flag: "🇧🇪" }, { name: "Bosnia and Herzegovina", flag: "🇧🇦" }, { name: "Bulgaria", flag: "🇧🇬" }, { name: "Croatia", flag: "🇭🇷" }, { name: "Cyprus", flag: "🇨🇾" }, { name: "Czechia", flag: "🇨🇿" }, { name: "Denmark", flag: "🇩🇰" }, { name: "Estonia", flag: "🇪🇪" }, { name: "Finland", flag: "🇫🇮" }, { name: "France", flag: "🇫🇷" }, { name: "Germany", flag: "🇩🇪" }, { name: "Greece", flag: "🇬🇷" }, { name: "Hungary", flag: "🇭🇺" }, { name: "Iceland", flag: "🇮🇸" }, { name: "Ireland", flag: "🇮🇪" }, { name: "Italy", flag: "🇮🇹" }, { name: "Latvia", flag: "🇱🇻" }, { name: "Liechtenstein", flag: "🇱🇮" }, { name: "Lithuania", flag: "🇱🇹" }, { name: "Luxembourg", flag: "🇱🇺" }, { name: "Malta", flag: "🇲🇹" }, { name: "Moldova", flag: "🇲🇩" }, { name: "Monaco", flag: "🇲🇨" }, { name: "Montenegro", flag: "🇲🇪" }, { name: "Netherlands", flag: "🇳🇱" }, { name: "Norway", flag: "🇳🇴" }, { name: "Poland", flag: "🇵🇱" }, { name: "Portugal", flag: "🇵🇹" }, { name: "Romania", flag: "🇷🇴" }, { name: "Russia", flag: "🇷🇺" }, { name: "San Marino", flag: "🇸🇲" }, { name: "Serbia", flag: "🇷🇸" }, { name: "Slovakia", flag: "🇸🇰" }, { name: "Slovenia", flag: "🇸🇮" }, { name: "Spain", flag: "🇪🇸" }, { name: "Sweden", flag: "🇸🇪" }, { name: "Switzerland", flag: "🇨🇭" }, { name: "Ukraine", flag: "🇺🇦" }, { name: "UK", flag: "🇬🇧" }, { name: "Vatican City", flag: "🇻🇦" },
        { name: "Antigua and Barbuda", flag: "🇦🇬" }, { name: "Bahamas", flag: "🇧🇸" }, { name: "Barbados", flag: "🇧🇧" }, { name: "Belize", flag: "🇧🇿" }, { name: "Canada", flag: "🇨🇦" }, { name: "Costa Rica", flag: "🇨🇷" }, { name: "Cuba", flag: "🇨🇺" }, { name: "Dominica", flag: "🇩🇲" }, { name: "Dominican Republic", flag: "🇩🇴" }, { name: "El Salvador", flag: "🇸🇻" }, { name: "Grenada", flag: "🇬🇩" }, { name: "Guatemala", flag: "🇬🇹" }, { name: "Haiti", flag: "🇭🇹" }, { name: "Honduras", flag: "🇭🇳" }, { name: "Jamaica", flag: "🇯🇲" }, { name: "Mexico", flag: "🇲🇽" }, { name: "Nicaragua", flag: "🇳🇮" }, { name: "Panama", flag: "🇵🇦" }, { name: "Saint Kitts and Nevis", flag: "🇰🇳" }, { name: "Saint Lucia", flag: "🇱🇨" }, { name: "Saint Vincent and the Grenadines", flag: "🇻🇨" }, { name: "Trinidad and Tobago", flag: "🇹🇹" }, { name: "USA", flag: "🇺🇸" },
        { name: "Argentina", flag: "🇦🇷" }, { name: "Bolivia", flag: "🇧🇴" }, { name: "Brazil", flag: "🇧🇷" }, { name: "Chile", flag: "🇨🇱" }, { name: "Colombia", flag: "🇨🇴" }, { name: "Ecuador", flag: "🇪🇨" }, { name: "Guyana", flag: "🇬🇾" }, { name: "Paraguay", flag: "🇵🇾" }, { name: "Peru", flag: "🇵🇪" }, { name: "Suriname", flag: "🇸🇷" }, { name: "Uruguay", flag: "🇺🇾" }, { name: "Venezuela", flag: "🇻🇪" },
        { name: "Algeria", flag: "🇩🇿" }, { name: "Angola", flag: "🇦🇴" }, { name: "Benin", flag: "🇧🇯" }, { name: "Botswana", flag: "🇧🇼" }, { name: "Burkina Faso", flag: "🇧🇫" }, { name: "Burundi", flag: "🇧🇮" }, { name: "Cabo Verde", flag: "🇨🇻" }, { name: "Cameroon", flag: "🇨🇲" }, { name: "Central African Republic", flag: "🇨🇫" }, { name: "Chad", flag: "🇹🇩" }, { name: "Comoros", flag: "🇰🇲" }, { name: "Congo (Brazzaville)", flag: "🇨🇬" }, { name: "Congo (Kinshasa)", flag: "🇨🇩" }, { name: "Côte d'Ivoire", flag: "🇨🇮" }, { name: "Djibouti", flag: "🇩🇯" }, { name: "Egypt", flag: "🇪🇬" }, { name: "Equatorial Guinea", flag: "🇬🇶" }, { name: "Eritrea", flag: "🇪🇷" }, { name: "Eswatini", flag: "🇸🇿" }, { name: "Ethiopia", flag: "🇪🇹" }, { name: "Gabon", flag: "🇬🇦" }, { name: "Gambia", flag: "🇬🇲" }, { name: "Ghana", flag: "🇬🇭" }, { name: "Guinea", flag: "🇬🇳" }, { name: "Guinea-Bissau", flag: "🇬🇼" }, { name: "Kenya", flag: "🇰🇪" }, { name: "Lesotho", flag: "🇱🇸" }, { name: "Liberia", flag: "🇱🇷" }, { name: "Libya", flag: "🇱🇾" }, { name: "Madagascar", flag: "🇲🇬" }, { name: "Malawi", flag: "🇲🇼" }, { name: "Mali", flag: "🇲🇱" }, { name: "Mauritania", flag: "🇲🇷" }, { name: "Mauritius", flag: "🇲🇺" }, { name: "Morocco", flag: "🇲🇦" }, { name: "Mozambique", flag: "🇲🇿" }, { name: "Namibia", flag: "🇳🇦" }, { name: "Niger", flag: "🇳🇪" }, { name: "Nigeria", flag: "🇳🇬" }, { name: "Rwanda", flag: "🇷🇼" }, { name: "Sao Tome and Principe", flag: "🇸🇹" }, { name: "Senegal", flag: "🇸🇳" }, { name: "Seychelles", flag: "🇸🇨" }, { name: "Sierra Leone", flag: "🇸🇱" }, { name: "Somalia", flag: "🇸🇴" }, { name: "South Africa", flag: "🇿🇦" }, { name: "South Sudan", flag: "🇸🇸" }, { name: "Sudan", flag: "🇸🇩" }, { name: "Tanzania", flag: "🇹🇿" }, { name: "Togo", flag: "🇹🇬" }, { name: "Tunisia", flag: "🇹🇳" }, { name: "Uganda", flag: "🇺🇬" }, { name: "Zambia", flag: "🇿🇲" }, { name: "Zimbabwe", flag: "🇿🇼" },
        { name: "Australia", flag: "🇦🇺" }, { name: "Fiji", flag: "🇫🇯" }, { name: "Kiribati", flag: "🇰🇮" }, { name: "Marshall Islands", flag: "🇲🇭" }, { name: "Micronesia", flag: "🇫🇲" }, { name: "Nauru", flag: "🇳🇷" }, { name: "New Zealand", flag: "🇳🇿" }, { name: "Palau", flag: "🇵🇼" }, { name: "Papua New Guinea", flag: "🇵🇬" }, { name: "Samoa", flag: "🇼🇸" }, { name: "Solomon Islands", flag: "🇸🇧" }, { name: "Tonga", flag: "🇹🇴" }, { name: "Tuvalu", flag: "🇹🇻" }, { name: "Vanuatu", flag: "🇻🇺" }
    ],
    userCountryFlag: '🌸',
    petalInterval: null,
    reviewsPool: [
        { productTitle: "Shizuku House Blend", name: "Yuki.T", flag: "🇯🇵", rating: 5, en: "omg literally smells like a garden.. best way to start a spring morning fr", jp: "まじでお花畑の香り！春の朝に最高すぎる🌸", verified: true, timestamp: Date.now() - 86400000 * 2 },
        { productTitle: "Shizuku House Blend", name: "CoffeeJunkie", flag: "🇺🇸", rating: 4, en: "arrived super fast. u can tell they're high quality just by the smell of the bag alone", jp: "届くの早すぎ。袋開けた瞬間に質の良さがわかりますね。", verified: true, timestamp: Date.now() - 86400000 * 5 },
        { productTitle: "Sakura Mid Roast", name: "huuuxika", flag: "🇬🇧", rating: 5, en: "tried so many sakura roasts but this is the real deal. none of that fake artificial taste.", jp: "色んな桜系飲んだけどこれがガチ。変な人工感ゼロ。", verified: true, timestamp: Date.now() - 86400000 * 12 },
        { productTitle: "Midnight Espresso", name: "marcvous", flag: "🇫🇷", rating: 4, en: "dark & intense but doesnt have that burnt taste. honestly so smooth.", jp: "濃いけど苦すぎない。まじで口当たりがいいです。", verified: true, timestamp: Date.now() - 86400000 * 8 },
        { productTitle: "Vanilla Sakura Blend", name: "hana532", flag: "🇯🇵", rating: 5, en: "usually dont like flavored coffee but this combo is actually addictive!! trust me on this", jp: "普段はフレーバーコーヒー苦手だけどこれは別格。ハマるわ。", verified: true, timestamp: Date.now() - 86400000 * 20 },
        { productTitle: "Morning Blossom", name: "bschmidt", flag: "🇩🇪", rating: 4, en: "Not too acidic which is a big win for me, good everyday brew.", jp: "酸味が強すぎなくてイイ感じ。毎日飲めるやつ。", verified: true, timestamp: Date.now() - 86400000 * 15 },
        { productTitle: "Kyoto Night Roast", name: "rossirosiee", flag: "🇮🇹", rating: 5, en: "literally tastes like a Kyoto kissaten. incredible depth.", jp: "まじで京都の喫茶店の味。深みがすごい。", verified: true, timestamp: Date.now() - 86400000 * 3 },
        { productTitle: "Imperial Roast", name: "martinezzz", flag: "🇪🇸", rating: 5, en: "proper heavy hitter. if u need to wake up FAST, get this.", jp: "パンチ効きすぎ。一瞬で目が覚めるｗ", verified: true, timestamp: Date.now() - 86400000 * 30 },
        { productTitle: "Strawberry Latte Blend", name: "lillylilly", flag: "🇦🇺", rating: 5, en: "smells like strawberry candy but still tastes like real coffee?? fav morning treat", jp: "苺キャンディみたいな香りなのにちゃんとコーヒー。これ最高。", verified: true, timestamp: Date.now() - 86400000 * 1 },
        { productTitle: "Tokyo Drip Blend", name: "okkkenji", flag: "🇯🇵", rating: 4, en: "Consistent and clean. exactly what I wanted for my v60.", jp: "雑味がなくて綺麗。V60で淹れるのに最高です。", verified: true, timestamp: Date.now() - 86400000 * 10 },
        { productTitle: "Samurai Espresso", name: "venomousbutkind", flag: "🇸🇪", rating: 5, en: "Strong af. crema is perfect.", jp: "まじで強い。クレマも完璧。", verified: true, timestamp: Date.now() - 86400000 * 40 },
        { productTitle: "Cherry Blossom Breeze", name: "25Ari25", flag: "🇨🇦", rating: 4, en: "Super light, almost like tea. refreshing if u hate heavy beans.", jp: "お茶みたいに軽い。重いのが苦手な人には超おすすめ。", verified: true, timestamp: Date.now() - 86400000 * 25 },
        { productTitle: "Honey Sakura Roast", name: "elenaXx", flag: "🇬🇷", rating: 5, en: "honey flavor is subtle but definitely there. so unique.", jp: "ハチミツ感が絶妙。こんなの初めて飲んだかも。", verified: true, timestamp: Date.now() - 86400000 * 60 },
        { productTitle: "Osaka Café Blend", name: "jaaaYthegoaT", flag: "🇺🇸", rating: 4, en: "super cozy vibes. makes me miss japan so much", jp: "落ち着く味。日本に行きたくなっちゃう。", verified: true, timestamp: Date.now() - 86400000 * 45 },
        { productTitle: "Obsidian Velvet Roast", name: "alexxs00", flag: "🇳🇿", rating: 5, en: "Expensive but worth every cent for a special treat. insanely smooth.", jp: "高いけど、ご褒美にまじで良い。口当たり滑らかすぎてビビる。", verified: true, timestamp: Date.now() - 86400000 * 18 },
        { productTitle: "Sakura Caramel Roast", name: "chloe.soleil", flag: "🇫🇷", rating: 5, en: "caramel isnt too sweet, just adds a nice richness. 10/10", jp: "キャラメルが甘すぎないのがいい。リピ確定。", verified: true, timestamp: Date.now() - 86400000 * 7 },
        { productTitle: "Matcha Latte Blend", name: "sat00shi", flag: "🇯🇵", rating: 4.5, en: "interesting mix.. way better than expected tbh", jp: "意外な組み合わせだけど、まじでアリ。想像超えてきた。", verified: true, timestamp: Date.now() - 86400000 * 9 },
        { productTitle: "Sakura Mocha Blend", name: "bell1a220", flag: "🇺🇸", rating: 5, en: "choc + sakura is a vibe. love it.", jp: "チョコと桜とか絶対美味しいやつ。期待通りでした。", verified: true, timestamp: Date.now() - 86400000 * 11 },
        { productTitle: "Hokkaido Milk Blend", name: "h4444ns", flag: "🇩🇪", rating: 5, en: "so creamy even without milk. crazy good texture.", jp: "ミルクなしでもクリーミーってやばい。質感が最高。", verified: true, timestamp: Date.now() - 86400000 * 14 },
        { productTitle: "Uji Matcha Espresso", name: "mikuuyu", flag: "🇯🇵", rating: 5, en: "the matcha is actually legit. real uji quality", jp: "抹茶の味がしっかりしててガチ。さすが宇治産。", verified: true, timestamp: Date.now() - 86400000 * 22 },
        { productTitle: "Golden Hour Roast", name: "sunnyluvssun", flag: "🇦🇺", rating: 4, en: "bright n citrusy. feels like summer", jp: "シトラス系で爽やか。夏にピッタリな味。", verified: true, timestamp: Date.now() - 86400000 * 4 },
        { productTitle: "Zen Garden Decaf", name: "johnmiller", flag: "🇬🇧", rating: 5, en: "finally a decaf that doesnt taste like paper. actually flavorfull!!", jp: "やっと美味しいデカフェに出会えた。ちゃんと味がある！", verified: true, timestamp: Date.now() - 86400000 * 35 },
        { productTitle: "Sakura Citrus Blend", name: "yu.na", flag: "🇯🇵", rating: 4, en: "Really refreshing. Perfect afternoon pick me up ^^", jp: "さっぱりしてて美味しい。午後のリフレッシュに最適。^^", verified: true, timestamp: Date.now() - 86400000 * 6 },
        { productTitle: "Dragon Pearl Jasmine", name: "weii.ioo", flag: "🇨🇳", rating: 5, en: "unbelievable aroma!!!! its an experience more than just a coffee", jp: "香りがやばい!!!もはやコーヒーっていうか体験レベル。", verified: true, timestamp: Date.now() - 86400000 * 50 },
        { productTitle: "Kuro-Diamond Roast", name: "dmitrixp", flag: "🇷🇺", rating: 5, en: "intense n dark. perfect for espresso heads.", jp: "最高に濃い。エスプレッソ好きは絶対ハマるやつ。", verified: true, timestamp: Date.now() - 86400000 * 13 },
        { productTitle: "Shizuku House Blend", name: "hangrycat", flag: "🇺🇸", rating: 3, en: "idk its just ok. kinda watery for my taste tbh.. expected more", jp: "んー普通。ちょっと薄い気がする。もっと期待してたんだけどな。", verified: true, timestamp: Date.now() - 86400000 * 28 },
        { productTitle: "Midnight Espresso", name: "pierre_75", flag: "🇫🇷", rating: 2, en: "delivery took way too long and the bag was open when it got here. coffee is alright tho", jp: "配送遅すぎ。届いたとき袋開いてたし。味はまあ普通だけど。", verified: true, timestamp: Date.now() - 86400000 * 32 },
        { productTitle: "Vanilla Sakura Blend", name: "sweetTooth00", flag: "🇨🇦", rating: 3, en: "tastes like drinking a candle lol maybe too much vanilla for me?", jp: "ロウソク飲んでるみたいｗ バニラ強すぎじゃない？", verified: true, timestamp: Date.now() - 86400000 * 42 },
        { productTitle: "Imperial Roast", name: "iamheretoo", flag: "🇬🇧", rating: 2, en: "Wayyyy too bitter. I know its dark roast but this is just straight up burnt", jp: "苦すぎ。深煎りなのはいいけど、これただ焦げてるだけでしょ。", verified: true, timestamp: Date.now() - 86400000 * 38 },
        { productTitle: "Golden Hour Roast", name: "thomasJ", flag: "🇩🇪", rating: 3.5, en: "meh its fine i guess but u can get better stuff at the local market for cheaper", jp: "んー、悪くないけど近所の店でもっと安くて良いの買えるしなー。", verified: true, timestamp: Date.now() - 86400000 * 55 },
        { productTitle: "Shizuku House Blend", name: "urban_explorer", flag: "🇬🇧", rating: 5, en: "The packaging is so pretty, I almost didn't want to open it. Looks amazing on my coffee station.", jp: "パッケージがお洒落すぎて、開けるのがもったいないくらい。インテリアにも最高です。", verified: true, timestamp: Date.now() - 86400000 * 1 },
        { productTitle: "Tokyo Drip Blend", name: "minimalist_mama", flag: "🇩🇰", rating: 5, en: "Incredibly fast shipping to Copenhagen, impressed by the plastic-free packaging efforts", jp: "コペンハーゲンまで届くのがめちゃくちゃ早かった。プラスチックフリーな梱包も好印象です。", verified: true, timestamp: Date.now() - 86400000 * 2 },
        { productTitle: "Sakura Mid Roast", name: "pixel_pioneer", flag: "🇰🇷", rating: 4, en: "The website experience is so smooth. Love the small details in the branding.", jp: "サイトの使い心地が最高にスムーズ。ブランドのこだわりが細部まで感じられて好きだな。", verified: true, timestamp: Date.now() - 86400000 * 3 },
        { productTitle: "Kyoto Night Roast", name: "travel_bunny", flag: "🇹🇭", rating: 5, en: "The aroma takes me right back to my morning walks in Arashiyama. Such a vibe.", jp: "香りを嗅ぐだけで嵐山の朝の散歩を思い出します。雰囲気が最高。", verified: true, timestamp: Date.now() - 86400000 * 5 },
        { productTitle: "Vanilla Sakura Blend", name: "gift_guru", flag: "🇨🇦", rating: 5, en: "bought this as a birthday gift and the presentation was 10/10. my friend loved it🥰", jp: "友達の誕生日にプレゼントしたんだけど、パッケージが可愛くて大正解だった！", verified: true, timestamp: Date.now() - 86400000 * 6 },
        { productTitle: "Morning Blossom", name: "chill_vibe_only", flag: "🇳🇱", rating: 4, en: "The free stickers included in the box are so cute. Great attention to detail 🤩", jp: "おまけのステッカーが可愛すぎる。こういう細かいサービス、嬉しいよね。", verified: true, timestamp: Date.now() - 86400000 * 10 },
        { productTitle: "Samurai Espresso", name: "tech_nomad", flag: "🇸🇬", rating: 5, en: "The QR code on the bag for brewing tips was super helpful!!! Top notch customer service💯", jp: "袋のQRコードから淹れ方のコツが見れるの、マジで便利。カスタマーサービスも一流。", verified: true, timestamp: Date.now() - 86400000 * 15 },
        { productTitle: "Dragon Pearl Jasmine", name: "Angelineguerin", flag: "🇫🇷", rating: 5, en: "the design of the bag is literally ART. shizuku really understands luxury branding.", jp: "袋のデザインがもはや芸術。高級感のあるブランディングが素晴らしいです。", verified: true, timestamp: Date.now() - 86400000 * 20 },
        { productTitle: "Sakura Mid Roast", name: "bearlike.pummel", flag: "🇿🇦", rating: 5, en: "The unboxing was a whole experience. The aesthetic is perfect for my feed, and the quality is actually there too.", jp: "開封の儀からして最高。インスタ映えするし、クオリティも間違いなし。", verified: true, timestamp: Date.now() - 86400000 * 4 },
        { productTitle: "Kyoto Night Roast", name: "carioca_x", flag: "🇧🇷", rating: 4, en: "shipping to Rio was surprisingly fast, the bag arrived in perfect condition. very premium feel.", jp: "リオへの配送が驚くほど早かったです。梱包も完璧で、高級感があります。", verified: true, timestamp: Date.now() - 86400000 * 7 },
        { productTitle: "Morning Blossom", name: "nairobi_night", flag: "🇰🇪", rating: 5, en: "Reminds me of a high-end boutique hotel. The scent alone fills the entire room", jp: "高級ブティックホテルを思い出させる香り。部屋中に広がって最高です。", verified: true, timestamp: Date.now() - 86400000 * 12 },
        { productTitle: "Obsidian Velvet Roast", name: "heavymoon.light", flag: "🇦🇷", rating: 3, en: "It's good, but the import taxes make it a bit of a luxury. Saving this for special occasions.", jp: "良いんだけど、関税が高いから贅沢品だね。特別な日用にとっておきます。", verified: true, timestamp: Date.now() - 86400000 * 25 },
        { productTitle: "Tokyo Drip Blend", name: "desert_bloom_38", flag: "🇪🇬", rating: 3, en: "I had a question about the customs forms and support took two days to reply. The product is great though.", jp: "通関書類について質問したのに、返信に2日かかった。商品は素晴らしいんだけど。", verified: true, timestamp: Date.now() - 86400000 * 35 },
        { productTitle: "Shizuku House Blend", name: "sol_y.sombra", flag: "🇲🇽", rating: 5, en: "Love the Japanese-inspired minimalist design. It's so different from the local brands here.", jp: "ミニマルな日本風デザインが大好き。現地のブランドとは一味違いますね。", verified: true, timestamp: Date.now() - 86400000 * 2 },
        { productTitle: "Vanilla Sakura Blend", name: "net5skives", flag: "🇳🇬", rating: 5, en: "Sent this to my sister and she was obsessed with the free stickers and the handwritten note", jp: "妹に送ったら、おまけのステッカーと手書きのメッセージに大喜びしてました。", verified: true, timestamp: Date.now() - 86400000 * 18 },
        { productTitle: "Osaka Café Blend", name: "smallgoldfish138", flag: "🇻🇳", rating: 5, en: "the brewing guide QR code is a life saver. i've been doing it wrong for years lol", jp: "抽出ガイドのQRコードに救われた。今までずっと間違ったやり方で淹れてたわｗ", verified: true, timestamp: Date.now() - 86400000 * 9 },
        { productTitle: "Zen Garden Decaf", name: "andesadventurer", flag: "🇨🇱", rating: 5, en: "Appreciate the compostable elements in the shipping box. Small steps matter.", jp: "配送箱に堆肥化可能な素材が使われていて好感が持てる。小さな一歩が大事。", verified: true, timestamp: Date.now() - 86400000 * 22 },
        { productTitle: "Honey Sakura Roast", name: "aroundtheworld", flag: "🇲🇦", rating: 4.5, en: "Took a while to reach Casablanca, but the customer service was very communicative throughout.", jp: "カサブランカまで届くのに時間がかかったけど、CSの対応は終始丁寧でした。", verified: true, timestamp: Date.now() - 86400000 * 40 },
        { productTitle: "Yuzu Mist Roast", name: "hannaaaah", flag: "🇯🇵", rating: 5, en: "The aroma of yuzu is so refreshing! It's perfect for a light morning brew.", jp: "柚子の香りがとても爽やか！軽い朝のコーヒーにぴったりです。", verified: true, timestamp: Date.now() - 86400000 * 1 },
        { productTitle: "Yuzu Mist Roast", name: "itrustmydogonly", flag: "🇺🇸", rating: 5, en: "Incredible light roast. It almost feels like a citrus tea but with the depth of high quality coffee. Truly unique.", jp: "最高の浅煎り。シトラスティーのような感覚もありつつ、高品質なコーヒーの深みもあって本当にユニークです。", verified: true, timestamp: Date.now() - 86400000 * 3 },
        { productTitle: "Yuzu Mist Roast", name: "Leo.k", flag: "🇫🇷", rating: 4, en: "Very citrusy and bright. If you like dark, heavy coffee this isn't for you, but for a summer afternoon it's unbeatable.", jp: "とても柑橘系で明るい味わい。深煎りの重いコーヒーが好きな人には向きませんが、夏の午後には最高です。", verified: true, timestamp: Date.now() - 86400000 * 5 },
        { productTitle: "Herbal Lantern Blend", name: "Yu_MMY", flag: "🇯🇵", rating: 5, en: "the herbal scent is so relaxing^^ perfect for late afternoon", jp: "ハーブの香りがとてもリラックスできます。午後のひとときに最適。", verified: true, timestamp: Date.now() - 86400000 * 1 },
        { productTitle: "Herbal Lantern Blend", name: "CoffeeExplorer", flag: "🇨🇦", rating: 5, en: "Unique and soothing. It's like a warm hug in a cup.", jp: "ユニークで落ち着く味。^^ カップの中の温かい抱擁のようです。", verified: true, timestamp: Date.now() - 86400000 * 4 },
        { productTitle: "Sage Mist Blend", name: "satoshii_k", flag: "🇯🇵", rating: 5, en: "the combination of sage and coffee is surprisingly good, very grounding", jp: "セージとコーヒーの組み合わせが驚くほど良いです。心が落ち着きます。", verified: true, timestamp: Date.now() - 86400000 * 2 },
        { productTitle: "Sage Mist Blend", name: "Elena_Viisp", flag: "🇮🇹", rating: 5, en: "Elegant and smooth. It has this sophisticated herbal note that I've never tasted before...", jp: "エレガントで滑らか。今まで味わったことのない洗練されたハーブの香りがあります。", verified: true, timestamp: Date.now() - 86400000 * 6 },
        { productTitle: "Sage Mist Blend", name: "Mwdi.kim", flag: "🇬🇧", rating: 4, en: "A very solid medium roast. The sage is subtle but adds a lovely complexity.", jp: "非常にしっかりした中煎り。セージは控えめですが、素敵な複雑さを加えています。", verified: true, timestamp: Date.now() - 86400000 * 10 },
        { productTitle: "Vanilla Anmitsu Roast", name: "Coffeezen99", flag: "🇯🇵", rating: 5, en: "this tastes exactly like a bowl of anmitsu! the red bean notes are so clear.", jp: "まさにあんみつの味！小豆の風味がしっかりと感じられます。", verified: true, timestamp: Date.now() - 86400000 * 2 },
        { productTitle: "Vanilla Anmitsu Roast", name: "koi.fish", flag: "🇺🇸", rating: 5, en: "Perfect dessert coffee. The vanilla aroma is heavenly!", jp: "最高のデザートコーヒー。バニラの香りが天国みたい。", verified: true, timestamp: Date.now() - 86400000 * 5 },
        { productTitle: "Vanilla Anmitsu Roast", name: "not_Marc", flag: "🇩🇪", rating: 4, en: "A very unique medium roast. It's sweet and satisfying.", jp: "とてもユニークな中煎り。甘くて満足感があります。", verified: true, timestamp: Date.now() - 86400000 * 8 },
        { productTitle: "Sakura Latte Charm Keychain", name: "Y.sanaa.Y", flag: "🇯🇵", rating: 5, en: "So tiny and detailed. Looks just like the real house blend latte", jp: "小さくて細かい作り！本物のハウスブレンドラテそっくりです。", verified: true, timestamp: Date.now() - 86400000 * 1 },
        { productTitle: "Sakura Latte Charm Keychain", name: "katiie004", flag: "🇺🇸", rating: 5, en: "the perfect addition to my keys! high quality and super cute", jp: "鍵につけるのに最高。質も良くて超可愛いです。", verified: true, timestamp: Date.now() - 86400000 * 3 },
        { productTitle: "Shizuku Serenity Charm Keychain", name: "AyaKashi", flag: "🇯🇵", rating: 5, en: "The embroidery is so delicate. It really brings a sense of peace to my daily commute.", jp: "刺繍がとても繊細。毎日の通勤に心の安らぎを与えてくれます。", verified: true, timestamp: Date.now() - 86400000 * 2 },
        { productTitle: "Shizuku Serenity Charm Keychain", name: "meomeoAri", flag: "🇫🇷", rating: 5, en: "Beautiful quality gold thread. It feels like a real Japanese omamori.", jp: "金糸の質が素晴らしい。本物の日本のお守りのようです。", verified: true, timestamp: Date.now() - 86400000 * 5 },
        { productTitle: "Imperial Blends Pin Set", name: "deanbean", flag: "🇺🇸", rating: 5, en: "Absolutely stunning set. The gold outlines are so elegant and high quality.", jp: "本当に素晴らしいセットです。ゴールドの縁取りがとてもエレガントで高品質です。", verified: true, timestamp: Date.now() - 86400000 * 1 },
        { productTitle: "Imperial Blends Pin Set", name: "Yu_MMY", flag: "🇯🇵", rating: 5, en: "the divided cup pin is my favorite. such a creative design!", jp: "分割されたカップのピンが一番のお気に入りです。とてもクリエイティブなデザイン！", verified: true, timestamp: Date.now() - 86400000 * 4 },
        { productTitle: "Imperial Blends Pin Set", name: "meomeoAri", flag: "🇫🇷", rating: 5, en: "The gold plating is so shiny! They look like expensive jewelry on my bag.", jp: "金メッキがキラキラで綺麗！バッグにつけると高級なジュエリーみたいに見えます。", verified: true, timestamp: Date.now() - 86400000 * 7 },
        { productTitle: "Imperial Blends Pin Set", name: "CandleLightHearted", flag: "🇸🇪", rating: 4, en: "Very detailed, though the butterfly clutches are a bit tight. The lotus design is 10/10.", jp: "細部まで凝っていますが、留め具が少し固めです。蓮のデザインは最高ですね。", verified: true, timestamp: Date.now() - 86400000 * 12 },
        { productTitle: "Tranquil Blends Pin Set", name: "Chloe_Osweiler", flag: "🇱🇺", rating: 5, en: "the pastel gradients are gorgeous, the Zen Ripple pin helps me feel mindful just looking at it", jp: "パステルカラーのグラデーションが最高に可愛い。禅の波紋のピンは見ているだけで心が落ち着きます。", verified: true, timestamp: Date.now() - 86400000 * 3 },
        { productTitle: "Tranquil Blends Pin Set", name: "yu.na", flag: "🇯🇵", rating: 5, en: "Colors are even better in person. The Strawberry Latte pin is incredibly cute!!", jp: "実物の色味はもっと綺麗です。ストロベリーラテのピンがめちゃくちゃ可愛い！！", verified: true, timestamp: Date.now() - 86400000 * 6 },
        { productTitle: "Tranquil Blends Pin Set", name: "karolina.nv", flag: "🇨🇿", rating: 4, en: "Great quality and soft colors, but smaller than I expected. Still look great on a denim jacket.", jp: "質が良くて色合いも優しいですが、思ってたより小ぶりでした。デニムジャケットにはよく映えます。", verified: true, timestamp: Date.now() - 86400000 * 15 }
    ],

    footerTranslations: {
        en: {
            desc: "Crafting the perfect cup of coffee inspired by the seasons of Japan. Every bean tells a story of tradition and quality.",
            links: "Quick Links", visit: "Visit Us", newsletter: "Join Our Newsletter",
            fAbout: "About Us", fContact: "Contact Support",
            newsDesc: "Subscribe to get seasonal blend updates and special offers!",
            mikoT: "Meet Miko: Your Shizuku Barista 🌸",
            mikoB: "<div class='modal-content-card mb-3'><span class='modal-section-title'>Who is Miko?</span><p class='small mb-0'>Miko is our digital concierge and trainee barista. She's here to help you navigate our collections and find your perfect roast.</p></div><div class='modal-content-card mb-3'><span class='modal-section-title'>How She Works</span><p class='small mb-0'>She uses intent-based scoring to scan our entire product catalog for flavor notes and roast profiles that match your mood.</p></div><div class='p-2 rounded bg-light border-start border-sakura border-4'><small><b>⚠️ Beta Version:</b> As Miko is still in training, she may occasionally provide incorrect information or misunderstand complex requests. Thank you for your patience as she continues to learn! ✨</small></div>",
            newsNamePlh: "First Name", newsEmailPlh: "Email Address", newsBtn: "Join",
            newsSuccess: "You have successfully joined our newsletter!",
            newsError: "This email is already subscribed!",
            aboutT: "Our Story", 
            aboutB: "<p><b>Shizuku Coffee (雫コーヒー)</b> was founded in the heart of Kyoto with a simple mission: to capture the transient beauty of Japan's seasons in every cup.</p><p>Our signature 'Sakura-Roast' process uses high-altitude specialty beans, roasted daily in small batches to preserve a delicate, tea-like clarity. We work directly with family-owned farms to ensure every drop supports sustainable cultivation.</p><p><i>From the bloom of spring to the frost of winter, we invite you to experience coffee as an art form.</i></p>",
            contactT: "Customer Support", 
            contactB: "<p class='small mb-3'>Need help with an order or brewing advice? Our team typically responds within <b>24 hours</b>.</p><form id='footerContactForm' class='d-flex flex-column gap-2'><input type='text' class='form-control form-control-sm' placeholder='Order Number (Optional)'><textarea class='form-control form-control-sm' rows='3' placeholder='How can we help?'></textarea><button type='button' class='sakura-btn' style='font-size: 13px; padding: 8px;' onclick='window.showSakuraToast(\"Message sent!\", \"✉️\")'>Send Message</button></form><div class='mt-3 small'><b>Email:</b> hello@shizuku.coffee<br><b>Phone:</b> +81 03-1234-5678</div>",
            guideT: "Brewing the Perfect Sakura Cup ☕",
            guideB: "<div class='modal-content-card'><span class='modal-section-title'>The Ritual</span><ul class='list-unstyled mb-0'><li class='mb-2'>🌸 <b>Grind:</b> Medium-Coarse (like sea salt).</li><li class='mb-2'>🌡️ <b>Water:</b> 92°C (just off boil).</li><li class='mb-2'>⚖️ <b>Ratio:</b> 15g coffee to 250ml water.</li><li>⏱️ <b>Bloom:</b> Pour 30ml and wait 30s.</li></ul></div><div class='p-2 rounded bg-light border-start border-sakura border-4'><small><i>Pro Tip: Use a transparent glass to appreciate the tea-like clarity!</i></small></div>",
            policyT: "Returns & Exchanges", 
            policyB: "<div class='modal-content-card d-flex align-items-start gap-3 mb-3'><div><span class='fs-4'>📦</span></div><div><b>30-Day Guarantee</b><p class='small mb-0'>Return unopened items within 30 days for a full refund.</p></div></div><div class='modal-content-card d-flex align-items-start gap-3'><div><span class='fs-4'>✨</span></div><div><b>Quality Promise</b><p class='small mb-0'>Not loving the roast? Contact us for a complimentary blend exchange!</p></div></div><p class='small mt-3 text-muted italic'>*This is a student portfolio simulation; no real shipping or returns are processed.</p>",
            privacyT: "Technical Specification & Privacy",
            privacyB: "<div class='modal-content-card' style='background: rgba(255, 101, 163, 0.05); border: 1.5px dashed var(--sakura-pink-light);'><h6 class='modal-section-title' style='color: var(--sakura-pink-dark);'>Official Simulation Notice</h6><p class='small mb-3'>Shizuku operates as a standalone simulation for engineering demonstration. No physical inventory is maintained, no logistics are integrated, and no financial settlement occurs.</p><p class='small mb-3'><b>Data Persistence:</b> All operational data—including authentication state, order records, and user preferences—is persisted exclusively within the host browser's LocalStorage API. This ensures absolute data privacy and sovereignty.</p><div class='p-2 rounded bg-white border border-light mb-3'><small><b>Architecture Overview:</b> By utilizing a client-side Zero-Backend methodology, this application achieves near-zero latency for all state transitions while operating entirely within the user's secure environment.</small></div><button type='button' class='sakura-btn w-100' style='font-size: 13px; padding: 10px;' data-bs-dismiss='modal'>I Understand</button></div>",
            hoursW: "Mon - Fri: 8am - 7pm", hoursE: "Sat - Sun: 9am - 6pm",
            trackMsg: "Redirecting to your order history...",
            trackErr: "Please log in to track your orders!",
            surpriseBtn: "Surprise Me",
            clearBtn: "Clear Chat"
        },
        jp: {
            desc: "日本の四季にインスパイアされた、最高の一杯をお届けします。一粒の豆には伝統と品質の物語が詰まっています。",
            links: "クイックリンク", visit: "店舗案内", newsletter: "ニュースレター登録",
            fAbout: "私たちについて", fContact: "お問い合わせ",
            newsDesc: "季節限定ブレンドの最新情報や特別オファーをお届けします！",
            newsNamePlh: "お名前", newsEmailPlh: "メールアドレス", newsBtn: "登録",
            newsSuccess: "ニュースレターへの登録が完了しました！",
            newsError: "このメールアドレスは既に登録されています。",
            aboutT: "私たちの物語", 
            aboutB: "<p><b>雫コーヒー</b>は、京都の歴史ある街並みの中で、日本の四季の移ろいを一杯のコーヒーに閉じ込めるために誕生しました。</p><p>独自の『サクラ・ロースト』製法により、お茶のような透明感と繊細な香りを引き出しています。私たちは世界中の小規模農家と直接提携し、持続可能なコーヒー作りを支援しています。</p><p><i>春の芽吹きから冬の静寂まで、芸術としてのコーヒーをご体験ください。</i></p>",
            mikoT: "Mikoについて：あなたの専属バリスタ 🌸",
            mikoB: "<div class='modal-content-card mb-3'><span class='modal-section-title'>Mikoとは？</span><p class='small mb-0'>Mikoは雫コーヒーのデジタルコンシェルジュであり、見習いバリスタです。あなたにぴったりの一杯を見つけるお手伝いをします。</p></div><div class='modal-content-card mb-3'><span class='modal-section-title'>仕組み</span><p class='small mb-0'>会話の意図を分析し、カタログ全体からあなたの気分に合った風味や焙煎度をスキャンして提案します。</p></div><div class='p-2 rounded bg-light border-start border-sakura border-4'><small><b>⚠️ ベータ版：</b>Mikoは現在学習中のため、時々間違った情報を伝えたり、複雑なリクエストを誤解したりすることがあります。成長を見守っていただければ幸いです！ ✨</small></div>",
            contactT: "カスタマーサポート", 
            contactB: "<p class='small mb-3'>配送状況や淹れ方についてのご質問は、バリスタチームが<b>24時間以内</b>に回答いたします。</p><form id='footerContactForm' class='d-flex flex-column gap-2'><input type='text' class='form-control form-control-sm' placeholder='注文番号（任意）'><textarea class='form-control form-control-sm' rows='3' placeholder='メッセージをご入力ください'></textarea><button type='button' class='sakura-btn' style='font-size: 13px; padding: 8px;' onclick='window.showSakuraToast(\"送信完了しました。\", \"✉️\")'>メッセージを送信</button></form><div class='mt-3 small'><b>メール:</b> hello@shizuku.coffee<br><b>電話:</b> +81 03-1234-5678</div>",
            guideT: "究極の桜コーヒーの淹れ方 ☕",
            guideB: "<p>雫の豆が持つ繊細な香りを引き出すための、バリスタ秘伝の淹れ方です：</p><ul class='list-unstyled mb-3'><li class='mb-2'>🌸 <b>挽き方：</b>中粗挽き（海塩くらいの大きさ）。</li><li class='mb-2'>🌡️ <b>お湯：</b>92℃（沸騰後一呼吸置いた状態）。</li><li class='mb-2'>⚖️ <b>比率：</b>粉15gに対してお湯250ml。</li><li>⏱️ <b>蒸らし：</b>最初に30ml注いで30秒待ち、その後ゆっくり円を描くように。</li></ul><div class='p-2 rounded bg-light border-start border-sakura border-4'><small><i>ポイント：透明なグラスを使うと、お茶のような透明感を楽しめます。</i></small></div>",
            policyT: "返品・交換について",
            policyB: "<p>お客様に最高の一杯を見つけていただきたい。もしお好みに合わなかった場合は、お気軽にご相談ください。</p><ul class='list-unstyled'><li class='mb-2'>📦 <b>未開封の商品：</b>お届けから30日以内であれば全額返金いたします。</li><li class='mb-2'>☕ <b>品質保証：</b>開封後でも、品質に問題がある場合は7日以内にご連絡いただければ無料で交換いたします。</li><li class='mb-2'>🔄 <b>ブレンド交換：</b>「思ったより深かった」など、他の豆への交換も承ります！</li></ul><p class='small mt-3'><i>※このサイトはポートフォリオ用のシミュレーションのため、実際の返品は行われません。</i></p>",
            privacyT: "技術仕様およびプライバシー通知",
            privacyB: "<div class='modal-content-card' style='background: rgba(255, 101, 163, 0.05); border: 1.5px dashed var(--sakura-pink-light);'><h6 class='modal-section-title' style='color: var(--sakura-pink-dark);'>公式シミュレーションに関する通知</h6><p class='small mb-3'>雫コーヒーは、エンジニアリングデモンストレーションのための独立したシミュレーションとして動作しています。実際の在庫管理、物流統合、および金銭的決済は行われません。</p><p class='small mb-3'><b>データの永続性：</b>認証状態、注文記録、ユーザー設定を含むすべての運用データは、ブラウザのLocalStorage API内にのみ保存されます。これにより、完全なデータのプライバシーと主権が確保されます。</p><div class='p-2 rounded bg-white border border-light mb-3'><small><b>アーキテクチャの概要：</b>クライアントサイドの「ゼロバックエンド」手法を利用することで、すべての状態遷移においてゼロに近いレイテンシを実現し、ユーザーの安全な環境内のみで動作します。</small></div><button type='button' class='sakura-btn w-100' style='font-size: 13px; padding: 10px;' data-bs-dismiss='modal'>了解しました</button></div>",
            hoursW: "月 - 金：8:00 - 19:00", hoursE: "土 - 日：9:00 - 18:00",
            trackMsg: "注文履歴へ移動します...",
            trackErr: "注文を追跡するにはログインしてください！",
            surpriseBtn: "おまかせ",
            clearBtn: "履歴消去"
        }
    },

    tierTranslations: {
        en: {
            title: "Shizuku Loyalty Tiers",
            desc: "Your rank is based on lifetime points earned. Spending points for rewards will NOT lower your rank!",
            tiers: [
                { name: "Sprout", req: "0", desc: "Welcome to the family! Start your coffee journey." },
                { name: "Blossom", req: "500", desc: "Enjoy 5% bonus on seasonal blends." },
                { name: "Petal", req: "1500", desc: "10% off all Accessories & priority support." },
                { name: "Sakura", req: "5000", desc: "VIP Status: 10% off all Coffee, 20% off Accessories & Free Express Shipping." }
            ]
        },
        jp: {
            title: "雫ロイヤリティ・ティア",
            desc: "ランクは獲得した累計ポイントに基づいています。ポイントを特典と交換しても、ランクが下がることはありません！",
            tiers: [
                { name: "新芽 (Sprout)", req: "0", desc: "雫ファミリーへようこそ！コーヒーの旅を始めましょう。" },
                { name: "開花 (Blossom)", req: "500", desc: "季節限定ブレンドの5%ボーナス特典。" },
                { name: "花びら (Petal)", req: "1500", desc: "すべてのアクセサリーが10%オフ＆優先サポート。" },
                { name: "満開 (Sakura)", req: "5000", desc: "VIP特典：全コーヒー10%オフ、アクセサリー20%オフ、速達送料無料。" }
            ]
        }
    },

    chatHTML: `
        <div class="chat-widget" id="mikoChat">
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <span>Miko Assistant (BETA)</span>
                    <div class="d-flex align-items-center gap-2">
                        <button id="clearChatBtn" class="clear-chat-btn"></button>
                        <button class="btn-close btn-close-white" style="font-size: 12px;" id="closeChat"></button>
                    </div>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div id="mikoTyping" class="typing-indicator">Miko is typing...</div>
                </div>
                <div class="chat-quick-actions px-3 mb-2 d-flex gap-2">
                    <button id="surpriseMeBtn" class="helpful-btn" style="padding: 4px 10px; font-size: 11px;"></button>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" class="form-control" style="font-size: 13px; border-radius: 12px;" placeholder="Ask Miko something...">
                    <button class="sakura-btn" id="sendChat" style="padding: 5px 15px; font-size: 12px; margin: 0;">Send</button>
                </div>
            </div>
            <button class="chat-button" id="chatToggle">💬</button>
        </div>
    `,

    fullscreenOverlayHTML: `
        <div id="fullscreenOverlay" class="fullscreen-zoom-overlay">
            <button id="closeFullscreen" class="close-fullscreen" aria-label="Close fullscreen view">&times;</button>
            <img id="fullscreenImg" src="" alt="Product Preview">
        </div>
    `,

    footerHTML: `
        <footer class="glass-footer">
            <div class="container text-center text-md-start">
                <div class="row g-4">
                    <div class="col-lg-3 col-md-6">
                        <h5 class="fw-bold mb-3 footer-shop-name">Shizuku Coffee</h5>
                        <p class="small footer-desc" id="fDesc"></p>
                        <div class="footer-utilities">
                            <button type="button" class="utility-icon-btn" id="utilTrack" data-type="track"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><circle cx="18" cy="18" r="3" fill="white"/><path d="m22 22-1.5-1.5"/></svg></button>
                            <button type="button" class="utility-icon-btn" id="utilGuide" data-type="guide"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg></button>
                            <button type="button" class="utility-icon-btn" id="utilPolicy" data-type="policy"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v10"/><path d="M8 12h8"/></svg></button>
                            <button type="button" class="utility-icon-btn" id="utilMiko" data-type="miko"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg></button>
                        </div>
                    </div>
                    <div class="col-lg-2 col-md-6">
                        <h5 class="fw-bold mb-3 footer-links-title" id="fLinksTitle">Quick Links</h5>
                        <div class="d-flex flex-column gap-3">
                            <span class="footer-link" id="linkAbout">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                <span class="link-text"></span>
                            </span>
                            <span class="footer-link" id="linkContact">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                <span class="link-text"></span>
                            </span>
                            <span class="footer-link" id="linkPrivacy">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                <span class="link-text"></span>
                            </span>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <h5 class="fw-bold mb-3 footer-visit-title" id="fVisitTitle">Visit Us</h5>
                        <p class="small mb-1 footer-hours-week" id="fHoursW"></p>
                        <p class="small mb-3 footer-hours-end" id="fHoursE"></p>
                        <p class="small">1-2-3 Arashiyama, Ukyo Ward<br>Kyoto, 616-0003, Japan</p>
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <h5 class="fw-bold mb-3 footer-newsletter-title" id="fNewsTitle">Join Our Newsletter</h5>
                        <p class="small footer-newsletter-desc" id="fNewsDesc"></p>
                        <form class="newsletter-form mt-3 d-flex flex-column gap-2" id="newsletterForm">
                            <div class="newsletter-field-group">
                                <input type="text" class="form-control" id="newsletterName" required>
                            </div>
                            <div class="input-group newsletter-field-group">
                                <input type="email" class="form-control" id="newsletterEmail" style="font-size: 14px;" required>
                                <button class="sakura-btn" type="submit" id="newsletterBtn" style="border-radius: 0; margin: 0; width: 80px;">Join</button>
                            </div>
                        </form>
                    </div>
                </div>
                <hr class="my-4" style="border-top: 1px solid rgba(255, 182, 193, 0.3);">
                <p class="small mb-0 text-center">© 2026 Shizuku Coffee. All rights reserved. Made by <a href="https://github.com/e0zzza" target="_blank" style="color: inherit; text-decoration: underline;">e0zzza</a></p>
            </div>
        </footer>`,

    modalsHTML: `
        <div class="modal fade" id="aboutModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="aboutTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="aboutBody"></div></div></div></div>
        <div class="modal fade" id="contactModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="contactTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="contactBody"></div></div></div></div>
        <div class="modal fade" id="brewingModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="brewingTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="brewingBody" style="font-size: 15px;"></div></div></div></div>
        <div class="modal fade" id="policyModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="policyTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="policyBody" style="font-size: 15px;"></div></div></div></div>
        <div class="modal fade" id="mikoModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="mikoTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="mikoBody" style="font-size: 15px;"></div></div></div></div>
        <div class="modal fade" id="privacyNoticeModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="privacyNoticeTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="privacyNoticeBody" style="font-size: 15px;"></div></div></div></div>
        <div class="modal fade" id="tierModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="tierModalTitle"></h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="tierModalBody"></div></div></div></div>
    `,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        if (!document.getElementById('mikoChat')) {
            document.body.insertAdjacentHTML('beforeend', this.chatHTML);
        }
        
        if (!document.querySelector('.glass-footer')) {
            document.body.insertAdjacentHTML('beforeend', this.footerHTML);
            document.body.insertAdjacentHTML('beforeend', this.modalsHTML);
            document.body.insertAdjacentHTML('beforeend', this.fullscreenOverlayHTML);
        }

        if (!document.getElementById('beanModal')) {
            const html = `
            <div class="modal fade" id="beanModal" tabindex="-1" style="z-index: 2000;">
              <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header border-0">
                    <h5 class="modal-title" id="modalTitle"></h5>
                    <div id="modalRatingSummary" class="ms-2"></div>
                    <span id="modalPopularBadge" class="popular-badge" style="display:none;"></span>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    <span id="modalHeart" class="wishlist-heart ms-2" style="position:static; font-size: 28px;">♡</span>
                  </div>
                  <div class="modal-body d-flex flex-column flex-md-row">
                    <img id="modalImg" src="" class="me-md-4 mb-3 mb-md-0" width="250" height="250" alt="" style="border-radius:16px; object-fit:cover;">
                    <div class="flex-grow-1">
                        <p id="modalDesc" class="mb-3" style="font-size: 14.5px; line-height: 1.6;"></p>
                        <div class="mb-3">
                            <h6 id="modalRoastTitle" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--sakura-brown-light); margin-bottom: 6px; letter-spacing: 0.5px;">Roast Intensity</h6>
                            <div id="modalRoastMeter" class="d-flex gap-1"></div>
                        </div>

                        <div class="mb-4">
                            <h6 id="modalFlavorTitle" style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--sakura-brown-light); margin-bottom: 8px; letter-spacing: 0.5px;">Flavor Profile</h6>
                            <div id="modalFlavorTags" class="d-flex gap-2 flex-wrap"></div>
                        </div>

                        <div class="d-flex align-items-center justify-content-between mb-4 mt-auto">
                            <p class="fw-bold fs-3 mb-0" id="modalPrice" style="color: var(--sakura-brown-dark);"></p>
                            <div class="qty-selector d-flex align-items-center">
                                <button type="button" id="modalQtyDown" class="qty-btn" style="width: 32px; height: 32px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">−</button>
                                <span id="modalQtyValue" class="mx-3 fw-bold" style="min-width: 20px; text-align: center; font-size: 16px;">1</span>
                                <button type="button" id="modalQtyUp" class="qty-btn" style="width: 32px; height: 32px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">+</button>
                            </div>
                        </div>

                        <button class="sakura-btn w-100" id="modalAddCart" style="padding: 14px; font-size: 16px;">Add to Cart</button>
                        <p id="modalShippingMsg" class="text-center mt-3 mb-0" style="font-size: 11px; opacity: 0.6; color: var(--sakura-brown-light);">📦 Freshly roasted and shipped within 48 hours</p>
                    </div>
                  </div>
                  <div class="modal-footer d-block border-0 pt-0" style="text-align: left; background: rgba(255, 255, 255, 0.3); border-radius: 0 0 20px 20px; padding-bottom: 20px;">
                    <h6 id="reviewsTitle" style="font-weight: 600; color: var(--sakura-brown-dark); margin-bottom: 15px; margin-top: 10px;">Customer Reviews</h6>
                    <div id="modalReviews"></div>
                    <div class="review-form-container">
                        <h6 id="submitReviewTitle" style="font-weight: 600;">Submit Your Review</h6>
                        <form id="reviewForm" novalidate>
                            <input type="text" id="reviewerName" placeholder="Your Name" required>
                            <div class="star-rating-input">
                                <input type="radio" id="star5" name="rating" value="5" required><label for="star5" title="5 stars">★</label>
                                <input type="radio" id="star4" name="rating" value="4"><label for="star4" title="4 stars">★</label>
                                <input type="radio" id="star3" name="rating" value="3"><label for="star3" title="3 stars">★</label>
                                <input type="radio" id="star2" name="rating" value="2"><label for="star2" title="2 stars">★</label>
                                <input type="radio" id="star1" name="rating" value="1"><label for="star1" title="1 star">★</label>
                            </div>
                            <textarea id="reviewText" placeholder="Write your review here..." rows="3" maxlength="500" required></textarea>
                            <div id="reviewCharCounter" class="char-counter">0 / 500</div>
                            <button type="submit" class="sakura-btn review-submit-btn" id="submitReviewBtn">Submit Review</button>
                        </form>
                    </div>
                  </div>
                </div>
              </div>
        </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        }
        
        const modalEl = document.getElementById('beanModal');
        if (typeof bootstrap !== 'undefined' && modalEl) {
            this.bsModal = new bootstrap.Modal(modalEl);
        }

        if (!document.getElementById('global-grain')) {
            const grain = document.createElement('div');
            grain.id = 'global-grain';
            grain.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                pointer-events: none; z-index: 9999; opacity: 0.03;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            `;
            document.body.appendChild(grain);
        }
        document.getElementById('modalHeart')?.addEventListener('click', () => this.toggleWishlist());
        document.getElementById('modalAddCart')?.addEventListener('click', () => this.addToCart());
        document.getElementById('modalQtyUp')?.addEventListener('click', () => {
            this.currentQty++;
            document.getElementById('modalQtyValue').innerText = this.currentQty;
        });
        document.getElementById('modalQtyDown')?.addEventListener('click', () => {
            if (this.currentQty > 1) {
                this.currentQty--;
                document.getElementById('modalQtyValue').innerText = this.currentQty;
            }
        });

        const fsOverlay = document.getElementById('fullscreenOverlay');
        const fsImg = document.getElementById('fullscreenImg');
        const modalImg = document.getElementById('modalImg');

        if (fsOverlay) {
            fsOverlay.addEventListener('click', (e) => {
                if (e.target === fsOverlay || e.target.id === 'closeFullscreen') {
                    fsOverlay.classList.remove('active');
                }
            });

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && fsOverlay.classList.contains('active')) {
                    fsOverlay.classList.remove('active');
                }
            });
        }

        if (modalImg) {
            modalImg.addEventListener('click', function() {
                if (fsImg) fsImg.src = this.src;
                if (fsOverlay) fsOverlay.classList.add('active');
            });
        }

        this.initSearch();
        this.initChat();
        this.initTiltEffect();
        this.setAtmosphericTheme();
        this.initBokehBackground();
        this.startCommunitySimulation();
        this.updateFooterUI();
        this.loadChatHistory();
        this.renderRecentlyViewed();
        this.initScrollReveal();
        this.initProfileFlagSelector();
        this.initProfileRank();
        this.initProfileEmailVerification();
        this.initProfileSave();
        
            const petalsEnabled = localStorage.getItem("petalsEnabled") !== "false";
            this.updatePetals(petalsEnabled);

            if (!document.getElementById('petalToggleContainer')) {
                const petalToggleHtml = `
                    <div id="petalToggleContainer" style="position: fixed; bottom: 80px; left: 20px; z-index: 1000;">
                        <button id="petalToggle" class="sakura-btn" title="Toggle Falling Petals" style="padding: 10px 15px; font-size: 20px; background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur); border-radius: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: all 0.3s ease; width: auto;">
                            ${petalsEnabled ? '🌸' : '🚫'}
                        </button>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', petalToggleHtml);
            }

        document.getElementById('petalToggle')?.addEventListener('click', (e) => {
            const currentState = localStorage.getItem("petalsEnabled") !== "false";
            const newState = !currentState;
            localStorage.setItem("petalsEnabled", newState);
            e.target.innerText = newState ? '🌸' : '🚫';
            this.updatePetals(newState);
            const lang = localStorage.getItem("language") || "en";
            const msg = newState ? (lang === 'jp' ? "桜の花びらを有効にしました！ 🌸" : "Petals enabled! 🌸") : (lang === 'jp' ? "桜の花びらを無効にしました。 💨" : "Petals disabled. 💨");
            window.showSakuraToast(msg, newState ? '🌸' : '💨');
        });

            if (!document.getElementById('backToTop')) {
                const bttHtml = `<div id="backToTop" class="back-to-top" title="Back to Top"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="arrow-up-icon">
  <line x1="12" y1="19" x2="12" y2="5" />
  <polyline points="5 12 12 5 19 12" />
</svg>
</div>`;
                document.body.insertAdjacentHTML('beforeend', bttHtml);
            }
        const btt = document.getElementById('backToTop');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btt?.classList.add('show');
            } else {
                btt?.classList.remove('show');
            }
        });
        btt?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

            const setupAboutContact = (id, isAbout) => {
                document.getElementById(id)?.addEventListener('click', () => {
                    const lang = localStorage.getItem("language") || "en";
                    const t = this.footerTranslations[lang];
                    if (isAbout) {
                        document.getElementById('aboutTitle').innerText = t.aboutT;
                        document.getElementById('aboutBody').innerHTML = t.aboutB;
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('aboutModal')).show();
                    } else {
                        document.getElementById('contactTitle').innerText = t.contactT;
                        document.getElementById('contactBody').innerHTML = t.contactB;
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('contactModal')).show();
                    }
                });
            };
            setupAboutContact('linkAbout', true);
            setupAboutContact('menuAbout', true);
            setupAboutContact('linkContact', false);
            setupAboutContact('menuContact', false);
            
            
            const newsForm = document.getElementById("newsletterForm");
            if (newsForm) {
                newsForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    this.handleNewsletterSubmit(e);
                });
            }

            document.getElementById('linkPrivacy')?.addEventListener('click', () => {
                const lang = localStorage.getItem("language") || "en";
                const t = this.footerTranslations[lang];
                document.getElementById('privacyNoticeTitle').innerText = t.privacyT;
                document.getElementById('privacyNoticeBody').innerHTML = t.privacyB;
                bootstrap.Modal.getOrCreateInstance(document.getElementById('privacyNoticeModal')).show();
            });

        document.getElementById('reviewForm')?.addEventListener('submit', (e) => this.submitReview(e));

        document.getElementById('modalReviews')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.helpful-btn');
            if (btn) {
                saveHelpfulCount(this.currentProduct.title, btn.dataset.name);
                this.renderProductReviews();
            }
        });

            this.detectUserLocation();

            document.addEventListener('click', (e) => {
            const badge = e.target.closest('.promo-code-badge');
            if (badge) {
            
            const codeMatch = badge.innerText.match(/[A-Z0-9]+/i);
            const code = codeMatch ? codeMatch[0] : "";

            const lang = localStorage.getItem("language") || "en";
            const msg = lang === 'jp' ? `コード「${code}」をコピーしました！` : `Code "<strong>${code}</strong>" copied to clipboard!`;

            const finish = () => window.showSakuraToast(msg, '📋');

            const fallbackCopy = (text) => {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; 
                document.body.appendChild(textArea);
                textArea.select();
                try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
                document.body.removeChild(textArea);
                finish();
            };

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(code).then(finish).catch(() => fallbackCopy(code));
            } else {
                fallbackCopy(code);
            }
            }
        });

            document.addEventListener('click', (e) => {
                const util = e.target.closest('.utility-icon-btn');
                if (util) {
                    e.preventDefault();
                    e.stopPropagation();
                    const type = util.dataset.type;
                    const lang = localStorage.getItem("language") || "en";
                    const t = QuickView.footerTranslations[lang];

                    if (type === 'guide') {
                        document.getElementById('brewingTitle').innerText = t.guideT;
                        document.getElementById('brewingBody').innerHTML = t.guideB;
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('brewingModal')).show();
                        return;
                    }

                    if (type === 'policy') {
                        document.getElementById('policyTitle').innerText = t.policyT;
                        document.getElementById('policyBody').innerHTML = t.policyB;
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('policyModal')).show();
                        return;
                    }

                    if (type === 'privacy') {
                        document.getElementById('privacyNoticeTitle').innerText = t.privacyT;
                        document.getElementById('privacyNoticeBody').innerHTML = t.privacyB;
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('privacyNoticeModal')).show();
                        return;
                    }

                    if (type === 'miko') {
                        document.getElementById('mikoTitle').innerText = t.mikoT;
                        document.getElementById('mikoBody').innerHTML = t.mikoB;
                        bootstrap.Modal.getOrCreateInstance(document.getElementById('mikoModal')).show();
                        return;
                    }

                    let msg = "";
                    let icon = "🌸";
                    
                    if (type === 'track') {
                        let user = null;
                        try {
                            user = JSON.parse(localStorage.getItem("loggedInUser"));
                        } catch(err) { user = null; }

                        let allOrders = [];
                        try {
                            allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
                        } catch(err) { allOrders = []; }

                        const userOrders = user ? allOrders.filter(o => o.userEmail === user.email) : [];

                        if (!user) {
                            msg = t.trackErr;
                            icon = '👤';
                        } else if (userOrders.length === 0) {
                            msg = lang === 'jp' ? "現在、追跡可能な注文はありません。" : "You have no active orders to track.";
                            icon = '📦';
                        } else {
                            msg = t.trackMsg;
                            icon = '🚚';
                            window.showSakuraToast(msg, icon);
                            setTimeout(() => window.location.href = "tracking.html", 1200);
                            return;
                        }
                    }
                    window.showSakuraToast(msg, icon);
                }
            });

            const reviewText = document.getElementById('reviewText');
            const charCounter = document.getElementById('reviewCharCounter');
            if (reviewText && charCounter) {
                reviewText.addEventListener('input', () => {
                    charCounter.innerText = `${reviewText.value.length} / 500`;
                });
            }
    },

    startCommunitySimulation: function() {
        const scheduleNext = () => {
            const min = 240000;
            const max = 600000;
            const delay = Math.floor(Math.random() * (max - min + 1)) + min;

            setTimeout(() => {
                const lang = localStorage.getItem("language") || "en";
                const p = SHIZUKU_PRODUCTS[Math.floor(Math.random() * SHIZUKU_PRODUCTS.length)];
                const flags = ["🇯🇵", "🇺🇸", "🇫🇷", "🇩🇪", "🇬🇧", "🇦🇺", "🇮🇹", "🇨🇦", "🇰🇷"];
                const flag = flags[Math.floor(Math.random() * flags.length)];
                const name = lang === 'jp' ? (p.title_jp || p.title) : p.title;
                const msg = lang === 'jp' ?
                    `${flag} の誰かが [[${name}]] を注文しました！` :
                    `Someone in ${flag} just ordered [[${name}]]!`;
                window.showSakuraToast(msg, '☕');
                
                scheduleNext();
            }, delay);
        };

        scheduleNext();
    },

    initSearch: function() {
        const searchInput = document.querySelector('.nav-search input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const selectors = ['.product-card', '.wishlist-card'];
            const isSearching = term !== "";
            let totalVisible = 0;
            
            selectors.forEach(sel => {
                const cards = document.querySelectorAll(sel);
                cards.forEach(card => {
                    const text = card.innerText.toLowerCase();
                    const isMatch = text.includes(term);
                    card.style.display = isMatch ? '' : 'none';
                    if (isMatch) totalVisible++;
                });
            });

            const recentSection = document.getElementById('recentlyViewedSection');
            if (recentSection) {
                recentSection.style.display = isSearching ? 'none' : 'block';
            }

            const pickBanner = document.getElementById('pickOfTheDay');
            if (pickBanner) {
                pickBanner.style.display = isSearching ? 'none' : 'block';
            }
        });
    },

    initTiltEffect: function() {
        const handleTilt = (e) => {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (centerY - y) / 10; 
            const rotateY = (x - centerX) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };

        const resetTilt = (e) => {
            e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        };

        const observeCards = () => {
            document.querySelectorAll('.product-card').forEach(card => {
                if (card.dataset.tiltInit) return;
                card.addEventListener('mousemove', handleTilt);
                card.addEventListener('mouseleave', resetTilt);

                card.addEventListener('click', (e) => {
                    if (e.target.closest('.add-btn') || e.target.closest('.wishlist-heart')) return;
                    
                    const rawTitle = card.getAttribute('data-title') || card.querySelector('h3')?.innerText.trim();
                    const titleText = rawTitle ? rawTitle.replace(/\u00a0/g, ' ').trim() : '';
                    const products = window.SHIZUKU_PRODUCTS || (typeof SHIZUKU_PRODUCTS !== 'undefined' ? SHIZUKU_PRODUCTS : []);
                    if (!titleText || !products) return;
                    
                    const product = products.find(p => 
                        p.title === titleText || 
                        p.title_jp === titleText || 
                        p.title.toLowerCase() === titleText.toLowerCase() ||
                        (p.title_jp && p.title_jp.toLowerCase() === titleText.toLowerCase())
                    );
                    
                    if (product) QuickView.show(product);
                });

                card.dataset.tiltInit = "true";
            });
        };

        observeCards();
        
        if (this.tiltObserver) {
            this.tiltObserver.disconnect();
        }

        this.tiltObserver = new MutationObserver((mutations) => {
            const hasNewCards = mutations.some(m => Array.from(m.addedNodes).some(node =>
                node.nodeType === 1 && (node.classList.contains('product-card') || node.classList.contains('wishlist-card'))
            ));
            if (hasNewCards) {
                observeCards();
            }
        });
        
        const productGrid = document.getElementById('productGrid');
        const wishlistGrid = document.querySelector('.wishlist-grid'); 
        const wishlistContainer = document.getElementById('wishlistContainer'); 

        [productGrid, wishlistGrid, wishlistContainer].forEach(grid => {
            if (grid) this.tiltObserver.observe(grid, { childList: true });
        });
    },

    initScrollReveal: function() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting || entry.intersectionRatio > 0) {
                    entry.target.classList.add('reveal-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const elements = document.querySelectorAll('.product-card, .shop-title, .promo-banner, .glass-footer, .wishlist-card, .recently-viewed-section, .profile-card, .edit-profile-card, .order-history');
        elements.forEach((el, i) => {
            if (!el.classList.contains('reveal-visible')) {
                el.classList.add('reveal-hidden');
                el.style.transitionDelay = `${(i % 4) * 0.1}s`; 
            }
            observer.observe(el);
        });
    },

    setAtmosphericTheme: function() {
        const hour = new Date().getHours();
        const body = document.body;

        body.classList.remove('theme-dawn', 'theme-day', 'theme-dusk', 'theme-night');
        
        if (hour >= 5 && hour < 9) body.classList.add('theme-dawn');
        else if (hour >= 9 && hour < 17) body.classList.add('theme-day');
        else if (hour >= 17 && hour < 21) body.classList.add('theme-dusk');
        else body.classList.add('theme-night');
    },

    initChat: function() {
        let isSending = false;
        const toggle = document.getElementById('chatToggle');
        const windowEl = document.getElementById('chatWindow');
        const close = document.getElementById('closeChat');
        const send = document.getElementById('sendChat');
        const input = document.getElementById('chatInput');
        const chatMsgContainer = document.getElementById('chatMessages');

        toggle?.addEventListener('click', () => {
            const isOpening = windowEl.style.display !== 'flex';
            windowEl.style.display = isOpening ? 'flex' : 'none';
            
            if (isOpening && chatMsgContainer.querySelectorAll('.chat-msg').length === 0) {
                this.renderPickOfTheDay();
                handleSend(localStorage.getItem("language") === 'jp' ? 'こんにちは' : 'hello', true);
            }
        });

        close?.addEventListener('click', () => windowEl.style.display = 'none');

        const handleSend = async (forcedMsg = null, silent = false) => {
            let val = (typeof forcedMsg === 'string') ? forcedMsg : input.value.trim();
            
            if (isSending && typeof forcedMsg !== 'string') {
                return;
            }
            if (!val) return;
            const lang = localStorage.getItem("language") || "en";

            if (!silent) {
                const pickBanner = document.getElementById('pickOfTheDay');
                if (pickBanner) pickBanner.remove();
            }
            
            this.addChatMessage('user', val, !silent);
            input.value = '';

            let storageUser = JSON.parse(localStorage.getItem("loggedInUser") || "null");
            if (storageUser && storageUser.email && silent !== true && !(silent instanceof Event)) {
                const history = Array.isArray(storageUser.pointsHistory) ? storageUser.pointsHistory : [];
                const alreadyClaimed = history.some(tx => tx.reason === "First message with Miko" || tx.reason_jp === "Mikoとの初チャット");

                if (!alreadyClaimed) {
                    const pointTransaction = {
                        date: new Date().toISOString(),
                        amount: 15,
                        reason: "First message with Miko",
                        reason_jp: "Mikoとの初チャット"
                    };

                    let currentHistory = Array.isArray(storageUser.pointsHistory) ? storageUser.pointsHistory : [];
                    
                    if (currentHistory.length === 0 && (storageUser.points || 0) > 0) {
                        currentHistory = [{ date: storageUser.signupDate || new Date().toISOString(), amount: storageUser.points, reason: "Welcome Bonus", reason_jp: "新規登録ボーナス" }];
                    }

                    storageUser.points = (storageUser.points || 0) + 15;
                    storageUser.pointsHistory = [...currentHistory, pointTransaction];
                    
                    localStorage.setItem("loggedInUser", JSON.stringify(storageUser));

                    let users = JSON.parse(localStorage.getItem("users") || "[]");
                    users = users.map(u => u.email === storageUser.email ? storageUser : u);
                    localStorage.setItem("users", JSON.stringify(users));

                    const pointsMsg = lang === 'jp' ? "Mikoとの初チャットで15ポイント獲得しました！ 🎁" : "You earned 15 loyalty points for your first chat with Miko! 🎁";

                    setTimeout(() => window.showSakuraToast(pointsMsg, '✨'), 500);
                    window.dispatchEvent(new CustomEvent('shizuku_points_updated', { detail: storageUser }));
                }
            }

            const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
            const now = new Date();
            const siteContext = {
                userName: user ? user.username : null,
                isLoggedIn: !!user,
                cart: cart.map(i => i?.title || "Unknown"),
                currentTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                currentHour: now.getHours(),
                wishlist: wishlist.map(i => i?.title || "Unknown"),
                fullMenu: SHIZUKU_PRODUCTS.map(p => ({
                    name: p.title,
                    price: p.price
                }))
            };

            const trimmedHistory = this.chatHistory.slice(-4);

            const typing = document.getElementById('mikoTyping');
            if (typing) typing.style.display = 'block';
            chatMsgContainer.scrollTop = chatMsgContainer.scrollHeight; 
            try {
                isSending = true;
                await new Promise(resolve => setTimeout(resolve, 800));

                const response = this.generateLocalResponse(val, lang, siteContext);
                
                if (typing) typing.style.display = 'none';
                this.addChatMessage('bot', response);
            } catch (err) {
                console.error("Miko API call failed:", err);
                if (typing) typing.style.display = 'none';
                const defaultMsg = lang === 'jp' ? 'すみません、今は少し休憩中です。後でまた話しかけてくださいね！' : 'Miko is resting right now. Please try again later!';
                this.addChatMessage('bot', defaultMsg);
            } finally {
                isSending = false;
            }
        };
        
        send?.addEventListener('click', handleSend);
        input?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

        document.getElementById('surpriseMeBtn')?.addEventListener('click', () => {
            const currentLang = localStorage.getItem("language") || "en";
            handleSend(currentLang === 'jp' ? 'おまかせ' : 'surprise me');
        });

        document.getElementById('clearChatBtn')?.addEventListener('click', () => { 
            this.chatHistory = [];
            localStorage.removeItem('miko_chat_history');
            chatMsgContainer.innerHTML = '<div id="mikoTyping" class="typing-indicator">Miko is typing...</div>';
        });
    },

    getPickOfTheDay: function(lang) {
        const day = new Date().getDay();
        const p = SHIZUKU_PRODUCTS[day % SHIZUKU_PRODUCTS.length];
        const isJp = lang === 'jp';
        const name = isJp ? (p.title_jp || p.title) : p.title; 
        const weekday = new Intl.DateTimeFormat(isJp ? 'ja-JP' : 'en-US', { weekday: 'long' }).format(new Date());

        return isJp 
            ? `🌸 <b>Mikoの今日の一押し:</b> 今日は [[${name}]] が気分です。素敵な${weekday}にぴったりの一杯ですよ。`
            : `🌸 <b>Miko's Pick of the Day:</b> Today I'm loving the [[${name}]]. It's the perfect companion for this ${weekday}!`;
    },

    renderPickOfTheDay: function() {
        const lang = localStorage.getItem("language") || "en";
        const container = document.getElementById('chatMessages');
        if (!container) return; 
        const html = `
            <div id="pickOfTheDay" style="background: rgba(255, 182, 193, 0.1); border: 1px dashed var(--sakura-pink-main); border-radius: 12px; padding: 10px; margin-bottom: 15px; font-size: 12px; color: var(--sakura-brown-dark); line-height: 1.4;">
                ${this.getPickOfTheDay(lang).replace(/\[\[\s*(.*?)\s*\]\]/g, (match, name) => {
                    const escaped = name.trim().replace(/'/g, "\\'");
                    return `<span class="chat-product-link" style="text-decoration: underline; cursor: pointer; font-weight: 600;" onclick="QuickView.showByName('${escaped}')">${name}</span>`;
                })}
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', html);
    },

    generateLocalResponse: function(input, lang, context) {
        const msg = input.toLowerCase().trim();
        const isJp = lang === 'jp';
        const getName = (p) => isJp ? (p.title_jp || p.title) : p.title;
        const getTag = (p) => isJp ? (p.tagline_jp || p.tagline) : p.tagline;
        const getDesc = (p) => isJp ? (p.desc_jp || p.desc) : p.desc; 

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const lastBotMsg = [...this.chatHistory].reverse().find(m => m.role === 'assistant')?.content || "";

        const foundInMsg = SHIZUKU_PRODUCTS.filter(p => 
            msg.includes(p.title.toLowerCase()) || 
            (p.title_jp && msg.includes(p.title_jp.toLowerCase()))
        );

        const isComparing = /(compare|比較|くらべて|違い|versus|vs)/i.test(msg);
        const wasWaitingForSecond = lastBotMsg.includes('compare it with?') || lastBotMsg.includes('比較したいですか？');

        if (isComparing || (wasWaitingForSecond && foundInMsg.length > 0)) {
            let p1, p2;
            
            if (foundInMsg.length >= 2) {
                p1 = foundInMsg[0];
                p2 = foundInMsg[1];
            } else if (foundInMsg.length === 1 && wasWaitingForSecond) {
                const match = lastBotMsg.match(/\[\[(.*?)\]\]/);
                if (match) {
                    const firstName = match[1];
                    p1 = SHIZUKU_PRODUCTS.find(p => p.title === firstName || p.title_jp === firstName);
                    p2 = foundInMsg[0];
                }
            }

            if (p1 && p2 && p1.title !== p2.title) {
                const name1 = isJp ? (p1.title_jp || p1.title) : p1.title;
                const name2 = isJp ? (p2.title_jp || p2.title) : p2.title;
                const desc1 = isJp ? (p1.desc_jp || p1.desc) : p1.desc;
                const desc2 = isJp ? (p2.desc_jp || p2.desc) : p2.desc;

                if (isJp) {
                    return `お待たせしました！[[${name1}]]と[[${name2}]]を比較しますね！\n\n・焙煎度: ${name1}は${p1.roast}、${name2}は${p2.roast}です。\n・特徴: ${name1}は「${desc1}」、${name2}は「${desc2}」のノートが楽しめます。\n・価格: ${formatPrice(p1.price)} vs ${formatPrice(p2.price)}\n\nどちらが気になりますか？🌸`;
                } else {
                    return `Got it! Comparing [[${name1}]] and [[${name2}]] for you.\n\n• Roast: ${name1} is ${p1.roast}, while ${name2} is ${p2.roast}.\n• Profile: ${name1} features ${desc1}, and ${name2} has ${desc2}.\n• Price: ${formatPrice(p1.price)} vs ${formatPrice(p2.price)}\n\nWhich one sounds better to you? ☕`;
                }
            } else if (foundInMsg.length === 1) {
                const foundName = isJp ? (foundInMsg[0].title_jp || foundInMsg[0].title) : foundInMsg[0].title;
                return isJp ? `[[${foundName}]]ともう一つ、どの商品を比較したいですか？` : `I found [[${foundName}]], but what was the second coffee you wanted to compare it with?`;
            }
        }

        const wasWaitingForChoice = lastBotMsg.includes('sounds better to you?') || lastBotMsg.includes('どちらが気になりますか？');
        if (wasWaitingForChoice) {
            let selectedProduct = foundInMsg[0];
            
            if (!selectedProduct) {
                const matches = [...lastBotMsg.matchAll(/\[\[(.*?)\]\]/g)].map(m => m[1]);
                if (matches.length >= 2) {
                    if (/(first|former|1st|最初|1番目|一つ目|前者)/i.test(msg)) {
                        selectedProduct = SHIZUKU_PRODUCTS.find(p => p.title === matches[0] || p.title_jp === matches[0]);
                    } else if (/(second|latter|2nd|2番目|二つ目|最後|後者)/i.test(msg)) {
                        selectedProduct = SHIZUKU_PRODUCTS.find(p => p.title === matches[1] || p.title_jp === matches[1]);
                    }
                }
            }

            if (selectedProduct) {
                const name = isJp ? (selectedProduct.title_jp || selectedProduct.title) : selectedProduct.title;
                return isJp 
                    ? `[[${name}]]ですね！素晴らしい選択です。詳細をチェックしたり、カートに追加しますか？ 🌸`
                    : `[[${name}]] is a great choice! Would you like to see more details or add it to your cart? ☕`;
            }
        }

        if (/(can't decide|cannot decide|too many|help me choose|迷う|決められない|決まらない|選べない)/i.test(msg)) {
            const randomProduct = SHIZUKU_PRODUCTS[Math.floor(Math.random() * SHIZUKU_PRODUCTS.length)];
            const name = isJp ? (randomProduct.title_jp || randomProduct.title) : randomProduct.title;
            
            this.triggerMikoLuckEffect();
            
            return isJp 
                ? `運命に任せてみましょう... Miko's Luck! ✨\n私のおすすめは [[${name}]] です。この一杯が、あなたの今日を特別なものにしてくれるはずですよ。🌸`
                : `Let's leave it to fate... Miko's Luck! ✨\nI've chosen [[${name}]] for you. I have a feeling this is exactly what you need today! ☕`;
        }

        if (msg === "sakura" || msg === "桜" || msg.includes("magic") || msg.includes("魔法")) {
            this.triggerSakuraStorm();
            return isJp ? "桜の魔法をお見せしましょう！🌸" : "Let me show you some sakura magic! 🌸";
        }
        
        if (msg === "midnight" || msg === "ミッドナイト") {
            this.triggerMidnightEffect();
            return isJp ? "真夜中の静寂をお楽しみください... 🌙" : "Enjoy the silence of midnight... 🌙";
        }

        if (/(scroll to top|top of page|上に戻る|一番上)/i.test(msg)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return isJp ? "ページの一番上へ戻りますね。 🌸" : "Scrolling you back to the top! 🌸";
        }
        if (/(menu|shop|products|メニュー|ショップ|商品)/i.test(msg) && !/(recommend|suggest)/.test(msg)) {
            const el = document.querySelector('.shop-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            return isJp ? "ショップコーナーへどうぞ！ ☕" : "Let's head over to our coffee collection. ☕";
        }

        if (/(how are you|how's it going|元気|調子)/i.test(msg)) {
            return isJp 
                ? "絶好調です！焙煎したての豆の香りに包まれて幸せですよ。あなたはいかがですか？ ☕" 
                : "I'm doing wonderful! The smell of freshly roasted beans always keeps me in a good mood. How about you? ☕";
        }

        if (/(who are you|what are you|何者|誰)/i.test(msg)) {
            return isJp 
                ? "私は雫コーヒーの専属バリスタ、Mikoです！あなたにぴったりの豆を見つけるお手伝いをします。 🌸" 
                : "I'm Miko, your personal Shizuku Coffee barista! I'm here to help you find your next favorite roast. 🌸";
        }
        
        if (/(good|great|fine|wonderful|okay|ok|well|bad|tired|sleepy|良い|元気|絶好調|最高|まあまあ|普通|疲れ|眠い)/i.test(msg)) {
            if (/(how about you|how are you|いかがですか|あなたは|元気ですか)/i.test(lastBotMsg.toLowerCase())) {
                if (/(tired|sleepy|疲れ|眠い)/i.test(msg)) {
                    const strong = SHIZUKU_PRODUCTS.filter(p => p.roast === 'dark')[0];
                    return isJp 
                        ? `お疲れ様です。[[${getName(strong)}]] でエネルギーをチャージしませんか？ ⚡`
                        : `Sounds like you could use a lift! Our [[${getName(strong)}]] is perfect for waking up. ⚡`;
                }
                return isJp 
                    ? "それは良かったです！今日はどのようなコーヒーをお探しですか？ 🌸" 
                    : "That's lovely to hear! What kind of coffee are you in the mood for today? ☕";
            }
        }

        if (/(yes|yeah|sure|yep|please|お願いします|はい|そうですね|うん)/i.test(msg)) {
            const lastBotMsgObj = [...this.chatHistory].reverse().find(m => m.role === 'assistant');
            if (lastBotMsgObj && /(help|recommend|blend|cup|find|search|brew|お探し|お手伝い|選ぶ|いかが|一杯)/i.test(lastBotMsgObj.content.toLowerCase())) {
                const p = SHIZUKU_PRODUCTS[Math.floor(Math.random() * SHIZUKU_PRODUCTS.length)];
                return isJp 
                    ? `承知いたしました！それなら [[${getName(p)}]] はいかがでしょうか？ 🌸`
                    : `Great! In that case, I'd suggest our [[${getName(p)}]]. ☕`;
            }
        }

        if (/(hello|hi|hey|morning|こんにちは|おはよ|ハロー)/i.test(msg)) {
            return isJp ? "こんにちは！雫コーヒーへようこそ。🌸" : "Hello! Welcome to Shizuku Coffee. 🌸";
        }

        if (/(tired|sleepy|wake up|眠い|疲れ|元気)/i.test(msg)) {
            const strong = SHIZUKU_PRODUCTS.filter(p => p.roast === 'dark')[0];
            return isJp 
                ? `お疲れ様です！[[${getName(strong)}]] でシャキッとしませんか？ ⚡`
                : `Sounds like you need a boost! Try the [[${getName(strong)}]]. ⚡`;
        }
        
        if (/(gift|present|プレゼント|ギフト|贈り物)/i.test(msg)) {
            const pinSet = SHIZUKU_PRODUCTS.find(p => p.title === "Tranquil Blends Pin Set");
            if (pinSet) {
                return isJp 
                    ? `贈り物をお探しですか？新商品の [[${getName(pinSet)}]] は、穏やかなカフェの雰囲気を楽しめるデザインでギフトに最適ですよ。🌸`
                    : `Looking for a gift? Our new [[${getName(pinSet)}]] is a beautiful choice, capturing serene cafe vibes in elegant gold-framed designs. 🎁`;
            }
        }

        if (/(shipping|ship|配達|発送)/i.test(msg)) {
            return isJp 
                ? "私たちは実際に製品を配送しているわけではありません。これはシミュレーションのポートフォリオページです。"
                : "We don't actually deliver products. This is a simulation portfolio page.";
        }

        if (/(origin|from|source|起源|出所)/i.test(msg)) {
            return isJp 
                ? "私たちの豆は日本全土の最高のコーヒー生産地域から調達されています。"
                : "Our beans are sourced from the finest coffee-growing regions around the whole Japan.";
        }

        let bestMatch = null;
        let highestScore = 0;
        const tokens = msg.split(/\s+/).filter(t => t.length > 2);

        for (const p of SHIZUKU_PRODUCTS) { 
            let score = 0;
            const searchable = [p.title, p.title_jp, p.desc, p.desc_jp, p.tagline, p.tagline_jp, p.roast].join(" ").toLowerCase();
            
            tokens.forEach(token => {
                if (searchable.includes(token)) score += 10;
            });

            if (score > highestScore) {
                highestScore = score;
                bestMatch = p;
            }
        }

        if (bestMatch && highestScore > 0) {
            const matchResponses = isJp ? [
                `「${getName(bestMatch)}」のことですね！${getTag(bestMatch)} とても人気の商品ですよ。`,
                `${getName(bestMatch)}ですね。${getTag(bestMatch)} ぜひチェックしてみてください！`,
                `お目が高い！[[${getName(bestMatch)}]] は私のお気に入りの一つです。`
            ] : [
                `Ah, you're asking about the [[${getName(bestMatch)}]]. ${getTag(bestMatch)} It's one of our most loved blends!`,
                `The [[${getName(bestMatch)}]] is a fantastic choice. ${getTag(bestMatch)}`,
                `I see you're interested in our [[${getName(bestMatch)}]]. It's really special!`
            ];
            const finalResp = pick(matchResponses);
            return (finalResp === lastBotMsg) ? pick(matchResponses) : finalResp;
        }

        if (/(recommend|suggest|surprise|help|choose|おすすめ|おまかせ|選んで|相談)/i.test(msg)) {
            const popular = SHIZUKU_PRODUCTS.filter(p => p.popular && p.popular <= 5);
            const p = pick(popular.length > 0 ? popular : SHIZUKU_PRODUCTS);

            return isJp 
                ? `雫の一押しは [[${getName(p)}]] です！${getDesc(p)}の香りが素晴らしいですよ。 🌸`
                : `I highly recommend trying our [[${getName(p)}]]. It has beautiful notes of ${getDesc(p)}. ☕`;
        }

        const fallbacks = isJp ? [
            `すみません、もう少し詳しく教えていただけますか？例えば「浅煎り」や「フルーティー」など...`,
            `その質問にはまだお答えできないかもしれません。コーヒーの味や香りについて聞いてみてください！`,
            `迷ってしまいますね。まずは [[${getName(pick(SHIZUKU_PRODUCTS))}]] から試してみるのはいかがでしょう？`
        ] : [
            `I didn't quite catch that. Could you tell me more about what you like? Maybe a specific flavor?`,
            `I'm still learning! Try asking me about our dark roasts or fruity blends.`,
            `Not sure? Why not take a look at the [[${getName(pick(SHIZUKU_PRODUCTS))}]]? It's quite popular!`
        ];

        return pick(fallbacks);
    },

    addChatMessage: function(sender, text, render = true) {
        const msgContainer = document.getElementById('chatMessages');

        if (render) {
            const div = document.createElement('div');
            div.className = `chat-msg ${sender}`;
            if (sender === 'bot') {
                const linkedText = text.replace(/\[\[\s*(.*?)\s*\]\]/g, (match, name) => {
                    const escaped = name.trim().replace(/'/g, "\\'");
                    return `<span class="chat-product-link" onclick="QuickView.showByName('${escaped}')">${name}</span>`;
                });
                div.innerHTML = `<div class="bot-text">${linkedText.replace(/\n/g, '<br>')}</div>`;

                const feedback = document.createElement('div');
                feedback.className = 'chat-feedback';
                feedback.innerHTML = `
                    <span onclick="QuickView.handleMikoFeedback(true, this)">👍</span>
                    <span onclick="QuickView.handleMikoFeedback(false, this)">👎</span>
                `;
                div.appendChild(feedback);
            } else {
                div.innerText = text;
            }
            if (msgContainer) msgContainer.appendChild(div); 
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }

        this.chatHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text
        });
        this.saveChatHistory();
    },

    saveChatHistory: function() { 
        localStorage.setItem('miko_chat_history', JSON.stringify(this.chatHistory));
    },

    loadChatHistory: function() {
        const saved = localStorage.getItem('miko_chat_history');
        if (saved) {
            try {
                const history = JSON.parse(saved);
                history.forEach(msg => { 
                    this.addChatMessage(msg.role === 'user' ? 'user' : 'bot', msg.content, true);
                    this.chatHistory.pop();
                });
                this.chatHistory = history;
            } catch(e) { console.error("History load failed", e); }
        }
    },

    handleMikoFeedback: function(isPositive, btn) { 
        const lang = localStorage.getItem("language") || "en";
        const msg = lang === 'jp' ? "フィードバックありがとうございます！" : "Thanks for your feedback!";
        window.showSakuraToast(msg, isPositive ? '👍' : '👎');
        const container = btn.parentElement;
        container.style.pointerEvents = 'none';
        container.style.opacity = '0.4';
    },

    handleNewsletterSubmit: function(e) {
        const btn = document.getElementById("newsletterBtn");
        const emailInput = document.getElementById("newsletterEmail");
        if (!emailInput || !btn) return;
        const email = emailInput.value;
        const lang = localStorage.getItem("language") || "en";
        const t = this.footerTranslations[lang];

        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = "...";
        
        let subscribers = JSON.parse(localStorage.getItem("subscribers") || "[]");

        setTimeout(() => {
            if (subscribers.includes(email)) {
                window.showSakuraToast(t.newsError, "⚠️");
                btn.disabled = false;
                btn.innerText = originalText;
            } else {
                subscribers.push(email); 
                localStorage.setItem("subscribers", JSON.stringify(subscribers));
                window.showSakuraToast(t.newsSuccess, "💌");
                btn.innerText = "✓";
                btn.style.background = "#28a745"; 
                e.target.reset();
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerText = originalText;
                    btn.style.background = "";
                }, 3000);
            }
        }, 800);
    },

    updateFooterUI: function() {
        const lang = localStorage.getItem("language") || "en"; 
        const t = this.footerTranslations[lang];
        const fDesc = document.getElementById('fDesc');
        if (!fDesc) return;
        
        fDesc.innerText = t.desc;
        document.getElementById('fLinksTitle').innerText = t.links;
        document.querySelector('#linkAbout .link-text').innerText = t.fAbout;
        document.querySelector('#linkContact .link-text').innerText = t.fContact;
        document.querySelector('#linkPrivacy .link-text').innerText = lang === 'jp' ? "プライバシーと技術情報" : "Privacy & Technical Notice";
        document.getElementById('fVisitTitle').innerText = t.visit;
        document.getElementById('fHoursW').innerText = t.hoursW;
        document.getElementById('fHoursE').innerText = t.hoursE;
        document.getElementById('fNewsTitle').innerText = t.newsletter;
        document.getElementById('fNewsDesc').innerText = t.newsDesc;
        document.getElementById('newsletterName').placeholder = t.newsNamePlh;
        document.getElementById('newsletterEmail').placeholder = t.newsEmailPlh;
        document.getElementById('newsletterBtn').innerText = t.newsBtn;
        const surpriseBtn = document.getElementById('surpriseMeBtn');
        if (surpriseBtn) surpriseBtn.innerText = t.surpriseBtn;
        const clearBtn = document.getElementById('clearChatBtn');
        if (clearBtn) clearBtn.innerText = t.clearBtn; 

        if (document.getElementById('utilTrack')) document.getElementById('utilTrack').title = lang === 'jp' ? "注文を追跡" : "Track Order";
        if (document.getElementById('utilGuide')) document.getElementById('utilGuide').title = lang === 'jp' ? "淹れ方ガイド" : "Brewing Guide";
        if (document.getElementById('utilPolicy')) document.getElementById('utilPolicy').title = lang === 'jp' ? "返品ポリシー" : "Return Policy";
        if (document.getElementById('utilMiko')) document.getElementById('utilMiko').title = lang === 'jp' ? "Mikoについて" : "Meet Miko";
    },

    initProfileFlagSelector: function() {
        const container = document.getElementById('profileFlagSelector');
        if (!container) return;

        const lang = localStorage.getItem("language") || "en";
        const currentFlag = localStorage.getItem("userCountryFlag") || "🌸";
        const detectedName = localStorage.getItem("userCountryName") || (lang === 'jp' ? "不明" : "Unknown");

        this.pendingFlag = currentFlag; 
        const labelText = lang === 'jp' ? "出身国を選択" : "Location";
        const changeBtnText = lang === 'jp' ? "変更" : "Change";
        const step1Text = lang === 'jp' ? `あなたのIPアドレスに基づくと、現在の場所は：<strong>${detectedName}</strong>です。\n場所を変更しますか？` : `Based on your IP, you're currently in: <strong>${detectedName}</strong>.\nAre you sure you want to change your location?`;
        const step1Btn = lang === 'jp' ? "はい、変更します" : "Yes, I want to change";
        const refreshBtnText = lang === 'jp' ? "再検出" : "Detect Again";
        const step2Btn = lang === 'jp' ? "変更を保存" : "Confirm Selection";

        container.innerHTML = `
            <div class="mt-3 p-3 rounded-4" style="background: rgba(255,255,255,0.25); border: 1px solid var(--glass-border);">
                <div id="flagSelectorHeader" class="d-flex justify-content-between align-items-center">
                    <span class="profile-info mb-0" style="font-size: 14px; font-weight: 600;">
                        ${labelText}: <span id="selectedFlagDisplay" style="font-size: 1.2em;">${currentFlag}</span>
                    </span>
                    <button type="button" id="toggleFlagGrid" class="helpful-btn" style="padding: 4px 12px; font-size: 12px;">${changeBtnText}</button>
                </div>

                <div id="flagStep1Confirmation" class="mt-3 text-center" style="display: none; border-top: 1px solid var(--glass-border); padding-top: 15px;">
                    <p class="small mb-3" style="line-height: 1.5;">${step1Text}</p>
                    <button type="button" id="btnStep1Proceed" class="sakura-btn" style="padding: 6px 16px; font-size: 12px; width: auto; margin: 0 5px;">${step1Btn}</button>
                    <button type="button" id="btnRefreshLocation" class="sakura-btn secondary" style="padding: 6px 16px; font-size: 12px; width: auto; margin: 0 5px;">${refreshBtnText}</button>
                </div>
                
                <div id="flagGridWrapper" class="mt-3" style="display: none; border-top: 1px solid var(--glass-border); pt-3;">
                    <p class="small opacity-50 mb-2">${lang === 'jp' ? '新しい場所を選択してください' : 'Select your new location'}</p>
                    <input type="text" id="flagSearchInput" class="payment-input mb-3"
                           style="height: 38px; font-size: 13px;" 
                           placeholder="${lang === 'jp' ? '国名を検索...' : 'Search country...'}">
                    <div class="flag-grid-container mt-2">
                    ${this.flagData.map(f => `
                        <div class="flag-grid-item ${f.flag === currentFlag ? 'active' : ''}" 
                             title="${f.name}" 
                             data-flag="${f.flag}">
                            ${f.flag}
                        </div>
                    `).join('')}
                    </div>
                    <div id="flagStep2Confirmation" class="mt-3 text-center" style="display: none;">
                        <button type="button" id="btnStep2Save" class="sakura-btn" style="padding: 8px 20px; font-size: 13px; width: 100%;">${step2Btn}</button>
                    </div>
                </div>
            </div>
        `;

        const gridWrapper = document.getElementById('flagGridWrapper');
        const step1Div = document.getElementById('flagStep1Confirmation');
        const step2Div = document.getElementById('flagStep2Confirmation');
        const toggleBtn = document.getElementById('toggleFlagGrid');
        const searchInput = document.getElementById('flagSearchInput');
        const btnProceed = document.getElementById('btnStep1Proceed'); 
        const btnRefresh = document.getElementById('btnRefreshLocation');
        const btnSave = document.getElementById('btnStep2Save');

        toggleBtn.addEventListener('click', () => {
            const isStep1Visible = step1Div.style.display !== 'none';
            const isGridVisible = gridWrapper.style.display !== 'none';
            
            
            if (isStep1Visible || isGridVisible) {
                step1Div.style.display = 'none';
                gridWrapper.style.display = 'none';
            } else { 
                step1Div.style.display = 'block';
            }
        });

        btnProceed.addEventListener('click', () => {
            step1Div.style.display = 'none';
            gridWrapper.style.display = 'block';
            if (searchInput) setTimeout(() => searchInput.focus(), 50);
        });
        
        btnRefresh?.addEventListener('click', () => {
            btnRefresh.disabled = true;
            const originalText = btnRefresh.innerText;
            btnRefresh.innerText = "...";

            localStorage.removeItem("userCountryFlag");
            localStorage.removeItem("userCountryName"); 
            this.detectUserLocation();

            setTimeout(() => {
                const newName = localStorage.getItem("userCountryName") || "Unknown";
                const newFlag = localStorage.getItem("userCountryFlag") || "🌸";
                
                const msgEl = step1Div.querySelector('p');
                if (msgEl) {
                    msgEl.innerHTML = lang === 'jp' ? 
                        `あなたのIPアドレスに基づくと、現在の場所は：<strong>${newName}</strong>です。\n場所を変更しますか？` : 
                        `Based on your IP, you're currently in: <strong>${newName}</strong>.\nAre you sure you want to change your location?`;
                }
                btnRefresh.disabled = false; 
                btnRefresh.innerText = originalText;
                window.showSakuraToast(lang === 'jp' ? "場所を更新しました。" : "Location refreshed.", "📍");
            }, 1500);
        });

        searchInput?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            container.querySelectorAll('.flag-grid-item').forEach(item => {
                const name = item.getAttribute('title').toLowerCase();
                item.style.display = name.includes(term) ? 'flex' : 'none'; });
            }); 

        container.querySelectorAll('.flag-grid-item').forEach(item => {
            item.addEventListener('click', () => {
                container.querySelectorAll('.flag-grid-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                this.pendingFlag = item.dataset.flag; 
                step2Div.style.display = 'block';
            });
        });

        btnSave.addEventListener('click', () => {
            
            localStorage.setItem("userCountryFlag", this.pendingFlag);
            const display = document.getElementById('selectedFlagDisplay');
            if (display) display.innerText = this.pendingFlag; 
                
            gridWrapper.style.display = 'none';
            step2Div.style.display = 'none';
            window.showSakuraToast(lang === 'jp' ? "場所を更新しました。" : "Location updated successfully.", "📍");
        });
    },

    getLifetimePoints: function(user) {
        if (!user) return 0;
        const history = Array.isArray(user.pointsHistory) ? user.pointsHistory : [];
        
    
        const totalRedeemed = history.reduce((sum, tx) => {
            const isRedemption = tx.amount < 0 && (
                (tx.reason && tx.reason.toLowerCase().includes('redeem')) || 
                (tx.reason_jp && tx.reason_jp.includes('交換'))
            );
            return isRedemption ? sum + Math.abs(tx.amount) : sum;
        }, 0);

        return (user.points || 0) + totalRedeemed;
    },

    getCurrentTier: function(lifetimePoints) {
        if (lifetimePoints >= 5000) return { name: "Sakura", icon: "🌸", color: "#ff2e93" };
        if (lifetimePoints >= 1500) return { name: "Petal", icon: "✨", color: "#ff65a3" };
        if (lifetimePoints >= 500) return { name: "Blossom", icon: "🌿", color: "#ff9ecb" };
        return { name: "Sprout", icon: "🌱", color: "#8b6f63" };
    },

    initProfileRank: function(userOverride) {
        const container = document.getElementById('profileRankBadge');
        if (!container) return;
        const vipBadgeContainer = document.getElementById('sakuraVipBadge');

        const user = userOverride || this.getLoggedInUser();
        if (!user) return; 

        const lang = localStorage.getItem("language") || "en";
        const lifetime = this.getLifetimePoints(user);
        const tier = this.getCurrentTier(lifetime);

        container.innerHTML = `
            <div class="tier-badge-floating" style="cursor: pointer; border-color: ${tier.color};">
                <span class="tier-icon">${tier.icon}</span>
                <span class="tier-name" style="color: ${tier.color};">${tier.name}</span>
            </div>
            <div class="small mt-2 opacity-50" style="font-size: 11px;">
                ${lang === 'jp' ? '累計獲得ポイント' : 'Lifetime Points'}: ${lifetime}
            </div>
        `; 

    
        if (vipBadgeContainer) {
            if (tier.name === "Sakura") {
                vipBadgeContainer.style.display = 'block';
                vipBadgeContainer.innerHTML = `<div class="sakura-vip-badge"><span class="vip-icon">👑</span><span class="vip-text">${lang === 'jp' ? '桜VIPメンバー' : 'Sakura VIP Member'}</span></div>`;
                vipBadgeContainer.onclick = () => {
                    if (container) container.click();
                };
            } else {
                vipBadgeContainer.style.display = 'none';
                vipBadgeContainer.innerHTML = '';
                vipBadgeContainer.onclick = null;
            }
        } 

        const pg = document.getElementById('tierProgressContainer');
        const tierConfigs = [
            { name: "Sprout", icon: "🌱", color: "#8b6f63" },
            { name: "Blossom", icon: "🌿", color: "#ff9ecb" },
            { name: "Petal", icon: "✨", color: "#ff65a3" },
            { name: "Sakura", icon: "🌸", color: "#ff2e93" }
        ];

        if (pg) {
            const idx = tierConfigs.findIndex(c => c.name === tier.name);
            const next = this.tierTranslations[lang].tiers[idx + 1];
            if (next) {
                const currentReq = parseInt(this.tierTranslations[lang].tiers[idx].req);
                const nextReq = parseInt(next.req);
                const progress = ((lifetime - currentReq) / (nextReq - currentReq)) * 100;
                pg.innerHTML = `
                    <div class="d-flex justify-content-between mb-1" style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--sakura-brown-light);">
                        <span>${lifetime} pts</span><span>Next: ${next.name}</span>
                    </div>
                    <div class="progress-track" style="height: 6px;"><div class="progress-fill" style="width: ${Math.min(100, progress)}%; background: ${tier.color};"></div></div>`;
            } else {
                pg.innerHTML = `<div class="text-center small fw-bold opacity-50" style="font-size: 10px; color: var(--sakura-pink-dark);">MAX RANK REACHED</div>`;
            }
        }

        container.onclick = () => {
            const t = this.tierTranslations[lang];

            document.getElementById('tierModalTitle').innerText = t.title;

            const currentTierIndex = tierConfigs.findIndex(c => c.name === tier.name);
            const nextTierData = t.tiers[currentTierIndex + 1];
            let progressBarHtml = '';

            if (nextTierData) {
                const currentReq = parseInt(t.tiers[currentTierIndex].req);
                const nextReq = parseInt(nextTierData.req);
                const progressPoints = lifetime - currentReq;
                const totalRange = nextReq - currentReq;
                const percentage = Math.min(100, Math.max(0, (progressPoints / totalRange) * 100));
                const remaining = nextReq - lifetime;

                const progressLabel = lang === 'jp' ? 
                    `次のランク「${nextTierData.name}」まであと <strong>${remaining}</strong> ポイント` : 
                    `<strong>${remaining}</strong> points left until ${nextTierData.name}`;

                progressBarHtml = `
                    <div class="mb-4 px-2">
                        <div class="progress-track" style="height: 10px; background: rgba(0,0,0,0.05); border-radius: 10px;">
                            <div class="progress-fill" style="width: ${percentage}%; background: linear-gradient(90deg, ${tier.color}, ${tierConfigs[currentTierIndex+1].color}); border-radius: 10px;"></div>
                        </div>
                        <p class="text-center small mt-2 mb-0" style="font-size: 12px; opacity: 0.9;">${progressLabel}</p>
                    </div>
                `;
            } else {
                const maxTierName = t.tiers[t.tiers.length - 1].name;
                progressBarHtml = `
                    <div class="text-center mb-4 p-3 rounded-4" style="background: rgba(255, 101, 163, 0.05); border: 1px solid var(--sakura-pink-light);">
                        <p class="small fw-700 mb-0" style="color: var(--sakura-pink-dark);">${lang === 'jp' ? `最高ランク「${maxTierName}」に到達しました！🌸` : `You have reached the ultimate ${maxTierName} rank! 🌸`}</p>
                    </div>
                `;
            }

            let html = `<p class="small mb-4 text-center">${t.desc}</p>${progressBarHtml}<div class="d-flex flex-column gap-3">`;
            
            t.tiers.forEach((item, idx) => {
                const config = tierConfigs[idx];
                const isActive = tier.name === config.name;
                html += `
                    <div class="modal-content-card ${isActive ? 'border-sakura' : ''}" style="background: ${isActive ? 'rgba(255, 101, 163, 0.05)' : ''};">
                        <div class="d-flex align-items-center gap-3">
                            <span class="fs-3">${config.icon}</span>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between"><strong>${item.name}</strong><span class="small opacity-75">${item.req}+ pts</span></div>
                                <p class="small mb-0" style="font-size: 12px;">${item.desc}</p>
                            </div>
                            ${isActive ? '<span class="badge bg-success" style="font-size: 9px;">Current</span>' : ''}
                        </div>
                    </div>`;
            });
            document.getElementById('tierModalBody').innerHTML = html + `</div>`;
            bootstrap.Modal.getOrCreateInstance(document.getElementById('tierModal')).show();
        };
    },

    initProfileEmailVerification: function() {
        const verifyBtn = document.getElementById('verifyEmailBtn') || document.querySelector('.verify-email-btn');
        const emailInput = document.getElementById('profileEmail') || document.querySelector('input[type="email"]');

        if (!verifyBtn || !emailInput) return;

        verifyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (verifyBtn.disabled) return;

            let email = emailInput.value.trim();
            const lang = localStorage.getItem("language") || "en";
            const user = this.getLoggedInUser();
            
            if (!email || !email.includes('@') || !email.includes('.')) {
                const msg = lang === 'jp' ? "有効なメールアドレスを入力してください。" : "Please enter a valid email address.";
                window.showSakuraToast(msg, "⚠️");
                return;
            }

            const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
            const isTaken = allUsers.some(u => u.email === email && (user ? u.id !== user.id : true));
            
            if (isTaken) {
                const msg = lang === 'jp' ? "このメールアドレスは既に使用されています。" : "This email is already in use by another account.";
                window.showSakuraToast(msg, "⚠️");
                return;
            }

            verifyBtn.disabled = true;
            const originalContent = verifyBtn.innerHTML;
            verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            setTimeout(() => {
                const successMsg = lang === 'jp' ? "認証メールを送信しました！" : "Verification link sent to your email!";
                window.showSakuraToast(successMsg, "✉️");
                verifyBtn.innerHTML = lang === 'jp' ? "送信済み" : "Sent";
                
                if (user) {
                    user.isVerified = true;
                    localStorage.setItem("loggedInUser", JSON.stringify(user));
                    
                    
                    let users = JSON.parse(localStorage.getItem("users") || "[]");
                    users = users.map(u => u.id === user.id ? user : u);
                    localStorage.setItem("users", JSON.stringify(users));
                }
                
                setTimeout(() => {
                    verifyBtn.disabled = false;
                    verifyBtn.innerHTML = originalContent;
                }, 5000);
            }, 1200);
        });
    },

    initProfileSave: function() {
        const saveBtn = document.getElementById('saveProfileBtn');
        const emailInput = document.getElementById('profileEmail');

        if (!saveBtn || !emailInput) return;

        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = localStorage.getItem("language") || "en";
            const user = this.getLoggedInUser();
            const newEmail = emailInput.value.trim();
            
            if (!user) return;

            
            const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
            const duplicateEmail = allUsers.find(u => u.email === newEmail && u.id !== user.id);

            if (duplicateEmail) {
                const msg = lang === 'jp' ? "このメールアドレスは既に使用されています。" : "The email is already in use.";
                window.showSakuraToast(msg, "⚠️");
                return;
            }
            
            
            user.email = newEmail;
        
            
            localStorage.setItem("loggedInUser", JSON.stringify(user));
            
            
            const updatedUsers = allUsers.map(u => u.id === user.id ? user : u);
            localStorage.setItem("users", JSON.stringify(updatedUsers)); 

            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

            setTimeout(() => {
                const msg = lang === 'jp' ? "プロフィールを更新しました！" : "Profile updated successfully!";
                window.showSakuraToast(msg, "✨");
                saveBtn.disabled = false;
                saveBtn.innerText = lang === 'jp' ? "保存" : "Save Changes";
                if (typeof renderProfile === 'function') renderProfile(); 
            }, 1000);
        });
    },

    detectUserLocation: async function() {
        const cachedFlag = localStorage.getItem("userCountryFlag");
        const cachedName = localStorage.getItem("userCountryName");

        if (cachedFlag && cachedName) {
            this.userCountryFlag = cachedFlag;
            this.userCountryName = cachedName;
            return;
        }

        const lang = localStorage.getItem("language") || "en";
        const setDefaults = () => {
            this.userCountryFlag = lang === 'jp' ? "🇯🇵" : "🇬🇧";
            this.userCountryName = lang === 'jp' ? "日本" : "United Kingdom";
        };

        if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
             setDefaults();
             return;
         }


        const updateLocation = (code, countryName) => {
            const flag = code.toUpperCase().replace(/./g, char => 
                String.fromCodePoint(char.charCodeAt(0) + 127397)
            );
            this.userCountryFlag = flag;
            this.userCountryName = countryName || "Unknown";
            localStorage.setItem("userCountryFlag", this.userCountryFlag);
            localStorage.setItem("userCountryName", this.userCountryName);
        };
        
        try {
            let res = await fetch("https://ipapi.co/json/", { mode: 'cors' });
            if (res.ok) {
                let data = await res.json();
                if (data.country_code && !data.error) return updateLocation(data.country_code, data.country_name);
            }

            res = await fetch(`https://ipinfo.io/json`);
            if (res.ok) {
                let data = await res.json();
                if (data.country) return updateLocation(data.country, data.country_name || data.country);
            }
            
            setDefaults();
        } catch (err) {
            setDefaults();
        }
    },

    showByName: function(name) {
        const products = window.SHIZUKU_PRODUCTS || (typeof SHIZUKU_PRODUCTS !== 'undefined' ? SHIZUKU_PRODUCTS : []);
        if (!products || !name) return; 

        const cleanName = name.replace(/\u00a0/g, ' ').trim();
        const product = products.find(p => 
            p.title === cleanName || 
            p.title_jp === cleanName ||
            p.title.toLowerCase() === cleanName.toLowerCase() ||
            (p.title_jp && p.title_jp.toLowerCase() === cleanName.toLowerCase())
        );

        if (product) {
            this.show(product); 
        } else {
            console.warn(`Miko suggested a non-existent product: ${name}`);
            const lang = localStorage.getItem("language") || "en";
            const msg = lang === 'jp' ? "その商品は現在見つかりません。" : "I couldn't find that specific blend right now.";
            window.showSakuraToast(msg, '☕');
        }
    },

    show: function(product) {
        const lang = localStorage.getItem("language") || "en"; 
        const user = this.getLoggedInUser();
        const userTier = this.getCurrentTier(this.getLifetimePoints(user));
        const isBlossomPlus = user && userTier.name !== "Sprout";
        const isSeasonal = product.title.includes("Sakura") || product.roast === "flavored" || product.title.includes("桜");
        const isAccessory = product.roast === 'accessory';

        let disc = 0;
        if (userTier.name === "Sakura") {
            disc = isAccessory ? 20 : 10;
        } else {
            if (isAccessory && userTier.name === "Petal") disc = 10;
            else if (isSeasonal && isBlossomPlus) disc = 5;
        }
        
        this.currentProduct = product;
        this.reviewFilter = null; 
        this.trackViewed(product);

        document.getElementById('modalImg').src = product.img;
        document.getElementById('modalImg').alt = product.title;
        const titleEl = document.getElementById('modalTitle');
        const displayTitle = lang === 'jp' ? (product.title_jp || product.title) : product.title;
        titleEl.innerText = displayTitle;
        if (disc > 0) {
            titleEl.insertAdjacentHTML('beforeend', ` <span class="badge bg-success ms-1" style="font-size: 10px; vertical-align: middle;">${disc}% OFF</span>`);
        }
        
        const descText = lang === 'jp' ? (product.tagline_jp || product.tagline || "") : (product.tagline || "");
        document.getElementById('modalDesc').innerText = descText;

        const priceEl = document.getElementById('modalPrice');
        if (disc > 0) {
            priceEl.innerHTML = `<span class="text-decoration-line-through opacity-50 me-2" style="font-size: 0.7em;">${formatPrice(product.price)}</span><span style="color: var(--sakura-pink-dark);">${formatPrice(product.price * (1 - disc/100))}</span>`;
        } else {
            priceEl.innerText = formatPrice(product.price);
        }
        
        document.getElementById('modalAddCart').innerText = lang === 'jp' ? "カートに入れる" : "Add to Cart";

        this.currentQty = 1;
        document.getElementById('modalQtyValue').innerText = 1;

        const roastMeter = document.getElementById('modalRoastMeter');
        const roastTitle = document.getElementById('modalRoastTitle');
        
        if (roastMeter && roastTitle) {
            roastTitle.parentElement.style.display = isAccessory ? 'none' : 'block';
            const roastMap = { light: 1, medium: 3, dark: 5, flavored: 2 };
            const filled = roastMap[product.roast] || 1;
            let dotsHtml = '';
            for (let i = 0; i < 5; i++) {
                dotsHtml += `<span class="roast-dot ${i < filled ? 'filled' : ''}"></span>`;
            }
            roastMeter.innerHTML = dotsHtml;
        }
        
        const tagsContainer = document.getElementById('modalFlavorTags');
        const fullDesc = lang === 'jp' ? (product.desc_jp || "") : (product.desc || "");
        const taglineLower = descText.toLowerCase();

        if (isAccessory) {
            let specsHtml = '';
            if (product.material) {
                const label = lang === 'jp' ? '素材' : 'Material'; 
                const val = lang === 'jp' ? (product.material_jp || product.material) : product.material;
                specsHtml += `<span class="flavor-tag">${label}: ${val}</span>`;
            }
            if (product.dimensions) {
                const label = lang === 'jp' ? 'サイズ' : 'Dimensions';
                const val = lang === 'jp' ? (product.dimensions_jp || product.dimensions) : product.dimensions;
                specsHtml += `<span class="flavor-tag">${label}: ${val}</span>`;
            }
            tagsContainer.innerHTML = specsHtml || `<span class="flavor-tag" style="opacity:0.5">${lang === 'jp' ? '製品仕様なし' : 'No specifications'}</span>`; 
        } else {
            const tags = fullDesc.split(/[、,.]/).map(s => s.trim()).filter(s => {
                if (!s || s.toLowerCase().includes('roast') || s.includes('煎り')) return false;
                return !taglineLower.includes(s.toLowerCase());
            });
            tagsContainer.innerHTML = tags.length > 0 
                ? tags.map(t => `<span class="flavor-tag">${t}</span>`).join('')
                : `<span class="flavor-tag" style="opacity:0.5">${lang === 'jp' ? 'バランス良' : 'Balanced'}</span>`; 
        }

        if (roastTitle) roastTitle.innerText = lang === 'jp' ? "焙煎度" : "Roast Intensity";
        const flavorTitle = document.getElementById('modalFlavorTitle');
        if (flavorTitle) {
            flavorTitle.parentElement.style.display = 'block';
            flavorTitle.innerText = isAccessory ? (lang === 'jp' ? "製品仕様" : "Specifications") : (lang === 'jp' ? "風味プロファイル" : "Flavor Profile");
        }
        
        const shippingMsg = document.getElementById('modalShippingMsg');
        if (shippingMsg) {
            shippingMsg.innerText = isAccessory 
                ? (lang === 'jp' ? "📦 48時間以内に発送いたします" : "📦 Shipped within 48 hours")
                : (lang === 'jp' ? "📦 48時間以内に焙煎・発送いたします" : "📦 Freshly roasted and shipped within 48 hours");
        }

        document.getElementById('reviewsTitle').innerText = lang === 'jp' ? "カスタマーレビュー" : "Customer Reviews"; 
        document.getElementById('submitReviewTitle').innerText = lang === 'jp' ? "レビューを投稿する" : "Submit Your Review";
        document.getElementById('reviewerName').placeholder = lang === 'jp' ? "あなたの名前" : "Your Name";
        document.getElementById('reviewText').placeholder = lang === 'jp' ? "ここにレビューを書いてください..." : "Write your review here...";
        document.getElementById('submitReviewBtn').innerText = lang === 'jp' ? "レビューを送信" : "Submit Review";

        document.getElementById('reviewForm').reset();

        if (document.getElementById('reviewerName') && user) document.getElementById('reviewerName').value = user.username || ""; 
        const orders = JSON.parse(localStorage.getItem("orders") || "[]");
        
        const hasPurchased = user && orders.some(o => 
            (o.userEmail === user.email || o.email === user.email) && 
            o.items.some(i => i.name === product.title)
        );

        const isCheckoutFlow = ['basket.html', 'checkout.html', 'payment.html'].some(page => 
            window.location.pathname.includes(page)
        );

        const modalFooter = document.querySelector('#beanModal .modal-footer');
        if (modalFooter) {
            modalFooter.style.display = isCheckoutFlow ? 'none' : 'block';
        }

        const formContainer = document.querySelector('.review-form-container');
        if (formContainer) {
            formContainer.style.display = (hasPurchased && !isCheckoutFlow) ? 'block' : 'none'; 
        }

        if (hasPurchased && user?.username) {
            const nameInput = document.getElementById('reviewerName');
            if (nameInput) {
                nameInput.value = user.username;
                nameInput.readOnly = true;
            }
        }
        
        if (document.getElementById('reviewCharCounter')) document.getElementById('reviewCharCounter').innerText = "0 / 500";
        this.renderProductReviews();

        const badge = document.getElementById('modalPopularBadge');
        if (badge && product.popular && parseInt(product.popular) <= 3) {
            badge.style.display = 'inline-block';
            badge.innerText = lang === 'jp' ? "一番人気" : "Most Popular";
        } else if (badge) {
            badge.style.display = 'none';
        }
        
        this.updateHeart();
        if (this.bsModal) this.bsModal.show();
    },

    renderProductReviews: function() {
        const lang = localStorage.getItem("language") || "en";
        const reviewsContainer = document.getElementById('modalReviews');
        if (!reviewsContainer) return;

        const helpfulCounts = getHelpfulCounts();
        const userVotes = JSON.parse(localStorage.getItem('shizuku_user_votes') || '{}');  
        
        const pool = this.reviewsPool.filter(r => r.productTitle === this.currentProduct.title);
        const local = getReviewsForProduct(this.currentProduct.title);
        let allReviews = [...pool, ...local];

        
        if (this.reviewFilter) {
            allReviews = allReviews.filter(r => r.rating === this.reviewFilter);
        } 

        const filterBarHtml = `
            <div class="review-filter-bar mb-3 d-flex gap-2 overflow-auto pb-2">
                <button class="filter-pill ${!this.reviewFilter ? 'active' : ''}" onclick="QuickView.setReviewFilter(null)">All</button>
                ${[5, 4, 3, 2, 1].map(star => `
                    <button class="filter-pill ${this.reviewFilter === star ? 'active' : ''}" onclick="QuickView.setReviewFilter(${star})">
                        ${star} ★
                    </button>
                `).join('')}
            </div> 
        `;

        const sorted = [...allReviews].sort((a, b) => {
            const helpfulA = helpfulCounts[`${this.currentProduct.title}_${a.name}`] || 0;
            const helpfulB = helpfulCounts[`${this.currentProduct.title}_${b.name}`] || 0;
            if (helpfulA !== helpfulB) return helpfulB - helpfulA;
            return (b.timestamp || 0) - (a.timestamp || 0);
        }).slice(0, 3);
        
        if (sorted.length === 0) {
            reviewsContainer.innerHTML = filterBarHtml + `<p class="text-center py-3" style="font-size: 13px; color: var(--sakura-brown-light); opacity: 0.7;">${lang === 'jp' ? '該当するレビューがありません。' : 'No reviews match this filter.'}</p>`;
            return;
        }

        reviewsContainer.innerHTML = filterBarHtml + sorted.map(r => {
            const reviewKey = `${this.currentProduct.title}_${r.name}`;
            const hasVoted = !!userVotes[reviewKey];
            const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleDateString(lang === 'jp' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
            return `
                <div class="review-item mb-2">
                    <div class="d-flex align-items-center mb-1">
                        <span class="me-2">${r.flag}</span>
                        <strong style="font-size: 13px;">${r.name}</strong>
                        ${r.verified ? `<span class="verified-badge">✓ ${lang === 'jp' ? '認証済みの購入者' : 'Verified Buyer'}</span>` : ''}
                        <span class="ms-auto">${renderStars(r.rating)}</span>
                    </div>
                    <div style="font-size: 11px; opacity: 0.6; margin-bottom: 5px;">${dateStr}</div>
                    <p class="mb-0 italic" style="font-size: 13px; color: var(--sakura-brown-light);">"${lang === 'jp' ? (r.jp || r.en) : r.en}"</p>
                    <div class="mt-2 text-end">
                        <button class="helpful-btn ${hasVoted ? 'active' : ''}" data-name="${r.name}">
                            👍 ${lang === 'jp' ? '役に立った' : 'Helpful'} (${helpfulCounts[reviewKey] || 0})
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    },

    setReviewFilter: function(rating) {
        this.reviewFilter = rating; 
        this.renderProductReviews();
    },

    submitReview: function(event) {
        event.preventDefault();
        const lang = localStorage.getItem("language") || "en";
        const name = document.getElementById('reviewerName').value.trim();
        const text = document.getElementById('reviewText').value.trim();
        const ratingInput = document.querySelector('input[name="rating"]:checked');
        const rating = ratingInput ? parseInt(ratingInput.value) : 0; 

        if (!name || !text || rating === 0) {
            const errorMsg = lang === 'jp' ? "すべての項目を入力してください。" : "Please fill out all fields and select a rating!";
            window.showSakuraToast(errorMsg, '⚠️', 'rgba(255, 101, 163, 0.1)');
            return;
        }

        const orders = JSON.parse(localStorage.getItem("orders") || '[]');
        const user = JSON.parse(localStorage.getItem("loggedInUser"));
        const isVerified = user && orders.some(o => 
            (o.userEmail === user.email || o.email === user.email) && 
            o.items.some(i => i.name === this.currentProduct.title)
        );

        const newReview = {
            productTitle: this.currentProduct.title,
            name: name,
            flag: this.userCountryFlag,
            rating: rating,
            en: text,
            verified: !!isVerified,
            timestamp: Date.now()
        };
        
        addReviewForProduct(this.currentProduct.title, newReview);


        if (user) {
            const pointsTx = {
                date: new Date().toISOString(),
                amount: 10,
                reason: `Review for ${this.currentProduct.title}`,
                reason_jp: `${this.currentProduct.title_jp || this.currentProduct.title}のレビュー投稿`
            };
            
            user.points = (user.points || 0) + 10;
            user.pointsHistory = [...(Array.isArray(user.pointsHistory) ? user.pointsHistory : []), pointsTx];

            localStorage.setItem("loggedInUser", JSON.stringify(user));
            let users = JSON.parse(localStorage.getItem("users") || "[]");
            users = users.map(u => u.email === user.email ? user : u);
            localStorage.setItem("users", JSON.stringify(users));

            window.dispatchEvent(new CustomEvent('shizuku_points_updated', { detail: user })); 

            const pointsMsg = lang === 'jp' ? "レビュー投稿で10ポイント獲得しました！ 🎁" : "You earned 10 loyalty points for sharing your review! 🎁";
            setTimeout(() => window.showSakuraToast(pointsMsg, '✨'), 1500);
        }

        this.renderProductReviews();
        document.getElementById('reviewForm').reset();
        if (document.getElementById('reviewCharCounter')) document.getElementById('reviewCharCounter').innerText = "0 / 500";

        const icon = { 5: '🌸', 4: '✨', 3: '👍', 2: '☕', 1: '📝' }[rating] || '🌸';
        const msg = lang === 'jp' ? `${name}さん、レビューありがとうございます！` : `Thank you for your review, ${name}!`;

        window.showSakuraToast(msg, icon);

        if (typeof renderShop === 'function') renderShop();
    },

    trackViewed: function(product) {
        let viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]'); 
        viewed = viewed.filter(p => p.title !== product.title);
        viewed.unshift(product);
        localStorage.setItem('recentlyViewed', JSON.stringify(viewed.slice(0, 4)));
        this.renderRecentlyViewed();
    },

    renderRecentlyViewed: function() {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (viewed.length === 0) return;

        let container = document.getElementById('recentlyViewedSection');
        if (!container) {
            const shopContainer = document.querySelector('.shop-container') || document.body;
            shopContainer.insertAdjacentHTML('afterend', '<div id="recentlyViewedSection" class="recently-viewed-section"></div>');
            container = document.getElementById('recentlyViewedSection');
        }

        const lang = localStorage.getItem("language") || "en";
        const title = lang === 'jp' ? "最近チェックした商品" : "Recently Viewed Blends"; 
        
        container.innerHTML = `
            <div class="container">
                <h4 class="mb-4 fw-bold" style="color: var(--sakura-brown-dark); font-size: 1.2rem;">${title}</h4>
                <div class="recent-grid">
                    ${viewed.map(p => `
                        <div class="recent-item" onclick="QuickView.showByName('${p.title.replace(/'/g, "\\'")}')">
                            <img src="${p.img}" alt="${p.title}">
                            <div class="recent-info">
                                <p class="mb-0 fw-600">${lang === 'jp' ? (p.title_jp || p.title) : p.title}</p>
                                <p class="small opacity-70 mb-0">${formatPrice(p.price)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }, 

    updateHeart: function() {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isFav = wishlist.some(i => i.title === this.currentProduct.title);
        const heart = document.getElementById('modalHeart');
        if (heart) {
            heart.classList.toggle('active', isFav);
            heart.innerText = isFav ? '♥' : '♡';
        }
    },

    toggleWishlist: function() {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]'); 
        const idx = wishlist.findIndex(i => i.title === this.currentProduct.title);
        if (idx > -1) wishlist.splice(idx, 1);
        else wishlist.push(this.currentProduct);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        this.updateHeart();
        if (typeof updateWishlistCounter === 'function') updateWishlistCounter();
        if (window.location.pathname.includes('wishlist.html') && typeof renderWishlist === 'function') renderWishlist();
    },

    addToCart: function() {
        if (!this.currentProduct || !this.currentProduct.title) { 
            console.error("Attempted to add an invalid product to cart.");
            return;
        }

        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const item = cart.find(i => i.title === this.currentProduct.title);
        let qty = parseInt(this.currentQty, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        if (item) item.qty += qty;
        else cart.push({ ...this.currentProduct, qty: qty });
        localStorage.setItem('cart', JSON.stringify(cart)); 
        this.bsModal.hide();
        if (typeof updateCartBadge === 'function') updateCartBadge();
        if (window.location.pathname.includes('basket.html') && typeof renderCart === 'function') renderCart();

        const lang = localStorage.getItem("language") || "en";
        const productName = lang === 'jp' ? (this.currentProduct.title_jp || this.currentProduct.title) : this.currentProduct.title;
        const msg = `<span style="font-weight:600; color: var(--sakura-pink-main);">${productName}</span> ` + 
                    (lang === 'jp' ? 'がカートに追加されました！' : 'has been added to your cart!');

        const undoLabel = lang === 'jp' ? '元に戻す' : 'Undo';
        const productTitle = this.currentProduct.title;
        window.showSakuraToast(msg, '🛒', {
            text: undoLabel,
            callback: () => this.undoAddToCart(productTitle, qty)
        });
    },

    undoAddToCart: function(title, qtyToRemove) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]'); 
        const item = cart.find(i => i.title === title);
        if (item) {
            item.qty -= qtyToRemove;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.title !== title);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            if (typeof updateCartBadge === 'function') updateCartBadge();
            if (window.location.pathname.includes('basket.html') && typeof renderCart === 'function') renderCart();  
            
            const lang = localStorage.getItem("language") || "en";
            const msg = lang === 'jp' ? '操作を元に戻しました。' : 'Action undone.';
            window.showSakuraToast(msg, '↺');
        }
    },

    updatePetals: function(enabled) {
        if (enabled) { 
            if (this.petalInterval) return;
            this.petalInterval = setInterval(() => {
                const petal = document.createElement('div');
                petal.classList.add('petal');
                petal.style.left = Math.random() * 100 + 'vw';
                petal.style.animationDuration = Math.random() * 3 + 7 + 's';
                petal.style.width = Math.random() * 10 + 5 + 'px';
                petal.style.height = petal.style.width;
                document.body.appendChild(petal);
                setTimeout(() => petal.remove(), 10000);
            }, 1200);
        } else {
            if (this.petalInterval) {
                clearInterval(this.petalInterval);
                this.petalInterval = null;
            }
            document.querySelectorAll('.petal').forEach(p => p.remove());
        }
    },

    triggerSakuraStorm: function() {
        if (document.getElementById('sakuraEffectActive')) return; 
        if (!document.getElementById('sakura-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'sakura-ui-styles';
            style.innerHTML = `
                body.sakura-ui-active {
                    background-color: #fffafb !important;
                    color: #4a373b !important;
                }
                body.sakura-ui-active .sakura-btn {
                    background-color: var(--sakura-pink-main) !important;
                    color: white !important;
                    box-shadow: 0 0 15px rgba(255, 182, 193, 0.6);
                }
                body.sakura-ui-active .glass-footer {
                    background: rgba(255, 255, 255, 0.8) !important;
                }
                body, body .sakura-btn, body h1, body h2, body h3, body h4, body h5, body h6 {
                    transition: color 3s ease, background-color 3s ease, border-color 3s ease, box-shadow 3s ease !important;
                }
            `;
            document.head.appendChild(style);
        } 
        const activeFlag = document.createElement('div');
        activeFlag.id = 'sakuraEffectActive';
        document.body.appendChild(activeFlag);

        document.body.classList.add('sakura-ui-active');

        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const petal = document.createElement('div');
                petal.classList.add('petal'); 
                petal.style.left = Math.random() * 100 + 'vw';
                petal.style.animationDuration = Math.random() * 2 + 3 + 's'; 
                petal.style.width = Math.random() * 15 + 10 + 'px'; 
                petal.style.height = petal.style.width;
                petal.style.zIndex = "3000"; 
                document.body.appendChild(petal);
                setTimeout(() => petal.remove(), 5000);
            }, i * 100);
        }
        setTimeout(() => {
            document.body.classList.remove('sakura-ui-active');
            activeFlag.remove();
        }, 7000);
    },

    triggerMidnightEffect: function() {
        if (document.getElementById('midnightEffect')) return; 

        
        if (!document.getElementById('midnight-styles')) {
            const style = document.createElement('style');
            style.id = 'midnight-styles';
            style.innerHTML = `
                @keyframes miko-star-twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
                @keyframes miko-mist-drift {
                    from { transform: translateX(-10%); }
                    to { transform: translateX(10%); }
                }
                .midnight-grain {
                    filter: url(#grainyNoise);
                }
                body.midnight-ui-active, body.midnight-ui-active p, body.midnight-ui-active span:not(.chat-product-link), body.midnight-ui-active h1, body.midnight-ui-active h2, body.midnight-ui-active h3, body.midnight-ui-active h4, body.midnight-ui-active h5, body.midnight-ui-active h6 {
                    color: #c0c0c0 !important;
                }
                body.midnight-ui-active .sakura-btn {
                    background-color: #1a1a40 !important;
                    color: #e0e0e0 !important;
                    border-color: #c0c0c0 !important;
                    box-shadow: 0 0 20px rgba(26, 26, 64, 0.5);
                }
                body.midnight-ui-active h1, body.midnight-ui-active h2, body.midnight-ui-active h3, 
                body.midnight-ui-active h4, body.midnight-ui-active h5, body.midnight-ui-active h6 {
                    color: #e0e0e0 !important;
                }
                body, body .sakura-btn, body h1, body h2, body h3, body h4, body h5, body h6 {
                    transition: color 3s ease, background-color 3s ease, border-color 3s ease, box-shadow 3s ease !important;
                }
            `;
            document.head.appendChild(style);
        } 

        if (!document.getElementById('midnight-grain-svg')) {
            const svg = document.createElement('div');
            svg.id = 'midnight-grain-svg';
            svg.style.cssText = 'position: absolute; width: 0; height: 0; overflow: hidden; visibility: hidden;';
            svg.innerHTML = `<svg><filter id="grainyNoise"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.08"/></feComponentTransfer></filter></svg>`;
            document.body.appendChild(svg); 
        }

        const midnight = document.createElement('div');
        midnight.id = 'midnightEffect';
        midnight.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, rgba(2, 2, 5, 0.92) 0%, rgba(16, 16, 37, 0.88) 100%);
            opacity: 0;
            z-index: 4500;
            pointer-events: none;
            transition: opacity 3s ease-in-out;
            overflow: hidden;
        `; 

        const grain = document.createElement('div');
        grain.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            filter: url(#grainyNoise); opacity: 0.12; pointer-events: none;
        `;
        midnight.appendChild(grain);
        
        const mist = document.createElement('div');
        mist.style.cssText = `
            position: absolute; top: 0; left: -20%; width: 140%; height: 100%;
            background: radial-gradient(ellipse at center, rgba(100, 120, 255, 0.08) 0%, transparent 70%);
            filter: blur(40px);
            animation: miko-mist-drift 20s infinite alternate ease-in-out;
        `; 
        midnight.appendChild(mist);

        const moon = document.createElement('div');
        moon.style.cssText = `
            position: absolute;
            top: 12%;
            left: 12%;
            width: 100px;
            height: 100px;
            background: #fffdf0;
            border-radius: 50%;
            box-shadow: 0 0 50px 15px rgba(255, 253, 240, 0.2), 
                        inset -15px -15px 30px rgba(0,0,0,0.05);
            opacity: 0;
            transition: all 4s ease-out;
            transform: translateY(40px); 
        `;
        midnight.appendChild(moon);

        for (let i = 0; i < 80; i++) {
            const star = document.createElement('div');
            const size = Math.random() * 2 + 0.5;
            star.style.cssText = `
                position: absolute;
                width: ${size}px; height: ${size}px;
                background: white;
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.5 + 0.2};
                box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, 0.4);
                animation: miko-star-twinkle ${Math.random() * 4 + 2}s infinite ease-in-out;
                animation-delay: ${Math.random() * 4}s;
            `; 
            midnight.appendChild(star);
        }

        document.body.appendChild(midnight);

        
        setTimeout(() => {
            midnight.style.opacity = '1';
            moon.style.opacity = '0.9';
            moon.style.transform = 'translateY(-10px)';
            document.body.classList.add('midnight-ui-active');
        }, 50); 

        
        setTimeout(() => {
            midnight.style.opacity = '0';
            moon.style.transform = 'translateY(-40px)';
            document.body.classList.remove('midnight-ui-active');
            setTimeout(() => midnight.remove(), 3000);
        }, 8500);
    },

    triggerGoldenHourEffect: function() {
        if (document.getElementById('goldenHourEffect')) return; 
        
        if (!document.getElementById('golden-hour-styles')) {
            const style = document.createElement('style');
            style.id = 'golden-hour-styles';
            style.innerHTML = `
                body.golden-hour-active {
                    color: #4a2c2a !important;
                    background-color: #fff4e6 !important;
                }
                body.golden-hour-active .sakura-btn {
                    background: linear-gradient(135deg, #ff9e2c, #ff6b2c) !important;
                    color: white !important;
                    border: none !important;
                    box-shadow: 0 4px 15px rgba(255, 107, 44, 0.3);
                }
                .golden-bloom {
                    filter: brightness(1.1) saturate(1.2) sepia(0.2);
                }
            `;
            document.head.appendChild(style);
        } 

        const golden = document.createElement('div');
        golden.id = 'goldenHourEffect';
        golden.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(to bottom, rgba(255, 165, 0, 0.15), rgba(255, 69, 0, 0.1));
            pointer-events: none; z-index: 4000; opacity: 0;
            transition: opacity 3s ease-in-out;
        `; 

        const sun = document.createElement('div');
        sun.style.cssText = `
            position: absolute; bottom: -50px; right: 10%; width: 250px; height: 250px;
            background: radial-gradient(circle, rgba(255, 200, 100, 0.8) 0%, transparent 70%);
            filter: blur(30px); opacity: 0; transition: all 6s cubic-bezier(0.16, 1, 0.3, 1);
        `;
        golden.appendChild(sun); 
        document.body.appendChild(golden);
        document.body.classList.add('golden-hour-active', 'golden-bloom');

        setTimeout(() => {
            golden.style.opacity = '1';
            sun.style.opacity = '1';
            sun.style.transform = 'translateY(-150px)';
        }, 50); 

        setTimeout(() => {
            golden.style.opacity = '0';
            document.body.classList.remove('golden-hour-active', 'golden-bloom');
            setTimeout(() => golden.remove(), 3000);
        }, 9000);
    },

    triggerMikoLuckEffect: function() {
        if (document.getElementById('mikoLuckActive')) return;
        
        if (!document.getElementById('miko-luck-styles')) {
            const style = document.createElement('style');
            style.id = 'miko-luck-styles';
            style.innerHTML = `
                @keyframes miko-luck-sparkle {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; }
                    50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
                    100% { transform: scale(1) rotate(360deg); opacity: 0; }
                }
                .luck-sparkle {
                    position: fixed;
                    color: #ffd700;
                    font-size: 24px;
                    pointer-events: none;
                    z-index: 5000;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
                    animation: miko-luck-sparkle 0.8s ease-out forwards;
                }
                body.miko-luck-active {
                    box-shadow: inset 0 0 150px rgba(255, 215, 0, 0.2) !important;
                    transition: box-shadow 0.5s ease-in-out !important;
                }
            `;
            document.head.appendChild(style);
        }

        const activeFlag = document.createElement('div');
        activeFlag.id = 'mikoLuckActive';
        document.body.appendChild(activeFlag);
        document.body.classList.add('miko-luck-active');

        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'luck-sparkle';
                sparkle.innerHTML = '✨';
                sparkle.style.left = Math.random() * 100 + 'vw';
                sparkle.style.top = Math.random() * 100 + 'vh';
                document.body.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 800);
            }, i * 40);
        }

        setTimeout(() => {
            document.body.classList.remove('miko-luck-active');
            activeFlag.remove();
        }, 2500);
    },

    initBokehBackground: function() {
        if (document.getElementById('bokeh-container')) return; 
        
        const container = document.createElement('div');
        container.id = 'bokeh-container';
        container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: -1; overflow: hidden; opacity: 0.5;
        `;

        for (let i = 0; i < 6; i++) {
            const dot = document.createElement('div');
            const size = Math.random() * 300 + 200;
            dot.style.cssText = `
                position: absolute;
                width: ${size}px; height: ${size}px;
                background: radial-gradient(circle, rgba(255, 182, 193, 0.15) 0%, transparent 70%);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                filter: blur(60px);
                animation: drift ${Math.random() * 20 + 20}s infinite alternate ease-in-out; 
            `;
            container.appendChild(dot);
        }
        
        const style = document.createElement('style');
        style.innerHTML = `@keyframes drift { 
            from { transform: translate(0,0) scale(1); } 
            to { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.1); } 
        }`;
        document.head.appendChild(style);
        document.body.appendChild(container);
    },

    validateVoucher(code) {
        const user = JSON.parse(localStorage.getItem("loggedInUser")); 
        if (!user || !user.vouchers) return { success: false, error: "No vouchers found" };

        const voucher = user.vouchers.find(v => v.code === code);
        if (!voucher) return { success: false, error: "Invalid code" };
        if (voucher.used) return { success: false, error: "Voucher already used" };

        return { success: true, voucher };
    },

    calculateDiscount(voucher, subtotal, shipping) {
        const subtotalNum = parseFloat(subtotal) || 0;
        const lang = localStorage.getItem("language") || "en";

        if (voucher.name.includes("10%")) {
            return { amount: subtotalNum * 0.1, type: 'percent', success: true };
        }
        if (voucher.name.includes("Express Shipping") || voucher.name.includes("速達配送料無料")) {
            return { amount: shipping, type: 'shipping', success: true };
        }
        if (voucher.name.includes("€5") || voucher.name.includes("¥800")) { 
            if (subtotalNum < 10) {
                return {
                    amount: 0,
                    type: 'fixed',
                    success: false,
                    message: lang === 'jp' ? `このギフトカードは合計金額が€10.00（約¥1,600）以上の場合に利用可能です。` : `Minimum purchase of €10.00 required for this gift card.`
                };
            }
            const actualDiscount = Math.min(5, subtotalNum);
            return { amount: actualDiscount, type: 'fixed', success: true, message: '' };
        }
        return { amount: 0, type: 'none', success: false };
    },

    getLoggedInUser: function() {
        try {
            return JSON.parse(localStorage.getItem("loggedInUser"));
        } catch (e) {
            console.error("Error parsing loggedInUser from localStorage", e);
            return null;
        }
    },

    applyVoucher: function(code) {
        const user = this.getLoggedInUser(); 
        if (!user || !user.vouchers) {
            window.showSakuraToast(localStorage.getItem("language") === 'jp' ? "ログインしてクーポンを使用してください。" : "Please log in to use vouchers.", "⚠️");
            return;
        }

        const voucher = user.vouchers.find(v => v.code === code);
        if (!voucher) {
            window.showSakuraToast(localStorage.getItem("language") === 'jp' ? "無効なクーポンコードです。" : "Invalid voucher code.", "⚠️");
            localStorage.removeItem('activeVoucherCode');
            this.renderCart();
            return;
        }
        if (voucher.used) {
            window.showSakuraToast(localStorage.getItem("language") === 'jp' ? "このクーポンは既に使用されています。" : "This voucher has already been used.", "⚠️");
            localStorage.removeItem('activeVoucherCode');
            this.renderCart();
            return;
        }

        localStorage.setItem('activeVoucherCode', code);
        this.renderCart();
        window.showSakuraToast(localStorage.getItem("language") === 'jp' ? "クーポンを適用しました！" : "Voucher applied!", "🎉");
    },

    removeVoucher: function() {
        localStorage.removeItem('activeVoucherCode');
        this.renderCart();
        window.showSakuraToast(localStorage.getItem("language") === 'jp' ? "クーポンを削除しました。" : "Voucher removed.", "🗑️");
    },

    renderCart: function() {
        const cart = getCart();
        const lang = localStorage.getItem("language") || "en";
        const isJp = lang === 'jp';
        const cartGrid = document.querySelector('.cart-grid');
        const cartSummary = document.querySelector('.cart-summary');

        if (!cartGrid || !cartSummary) return; 

        const validCart = cart.filter(item => item && item.title && item.price);
        if (validCart.length !== cart.length) {
            saveCart(validCart);
            return this.renderCart();
        }

        const user = this.getLoggedInUser();
        const lifetime = this.getLifetimePoints(user);
        const tier = this.getCurrentTier(lifetime);

        if (cart.length === 0) {
            cartGrid.innerHTML = `
                <div class="empty-state">
                    <img src="empty.png" class="empty-img">
                    <p class="empty-text">${isJp ? 'カートが空です 🌸' : 'Your cart is empty 🌸'}</p>
                    <a href="index.html" class="sakura-btn mt-3">${isJp ? 'お買い物に戻る' : 'Back to Shopping'}</a>
                </div>
            `;
            cartSummary.innerHTML = '';
            return;
        }

        cartGrid.innerHTML = cart.map(item => {
            const productRef = SHIZUKU_PRODUCTS.find(p => p.title === item.title);
            const roast = item.roast || productRef?.roast || 'light';
            
            return `
            <div class="cart-card" data-title="${item.title}">
                <img src="${item.img}" alt="${isJp ? (item.title_jp || item.title) : item.title}">
                <div class="cart-info">
                    ${(() => {
                        const isSeasonal = item.title.includes("Sakura") || item.roast === "flavored" || item.title.includes("桜");
                        let discount = 0;
                        if (tier.name === 'Sakura') {
                            discount = (roast === 'accessory') ? 20 : 10;
                        } else {
                            if (roast === 'accessory' && tier.name === 'Petal') discount = 10;
                            else if (roast !== 'accessory' && tier.name !== 'Sprout' && isSeasonal) discount = 5;
                        }

                        return `
                            <h3>
                                ${isJp ? (item.title_jp || item.title) : item.title}
                                ${discount > 0 ? `<span class="badge bg-success ms-1" style="font-size: 9px; vertical-align: middle;">${discount}% OFF</span>` : ''}
                            </h3>
                            <p>
                                ${discount > 0 
                                    ? `<span class="text-decoration-line-through opacity-50 me-1" style="font-size: 0.85em;">${formatPrice(item.price)}</span>
                                       <span class="fw-bold" style="color: var(--sakura-pink-dark);">${formatPrice(item.price * (1 - discount/100))}</span>`
                                    : formatPrice(item.price)}
                            </p>
                        `;
                    })()}
                </div>
                <div class="cart-actions">
                    <button class="qty-btn" data-title="${item.title}" data-action="decrease">−</button>
                    <span class="qty-number">${item.qty}</span>
                    <button class="qty-btn" data-title="${item.title}" data-action="increase">+</button>
                    <button class="delete-btn" data-title="${item.title}">${isJp ? '削除' : 'Remove'}</button>
                </div>
            </div>
        `;}).join('');
        
 
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
        
        let shippingCost = (subtotal > 50 || tier.name === "Sakura") ? 0 : 5;

        let accessoryDiscount = 0;
        if (tier.name === "Petal" || tier.name === "Sakura") {
            cart.forEach(item => {
                const productRef = SHIZUKU_PRODUCTS.find(p => p.title === item.title);
                const roast = item.roast || productRef?.roast;
                if (roast === "accessory") {
                    const rate = tier.name === "Sakura" ? 0.20 : 0.10;
                    accessoryDiscount += (parseFloat(item.price) * item.qty) * rate;
                }
            });
        }

        
        let tierDiscount = 0; 
        if (tier.name !== "Sprout") {
            cart.forEach(item => {
                const productRef = SHIZUKU_PRODUCTS.find(p => p.title === item.title);
                const roast = item.roast || productRef?.roast;
                if (roast !== "accessory") {
                    let rate = 0;
                    if (tier.name === "Sakura") {
                        rate = 0.10; 
                    } else {
                        const isSeasonal = item.title.includes("Sakura") || item.roast === "flavored" || item.title.includes("桜");
                        if (isSeasonal) rate = 0.05; 
                    }
                    tierDiscount += (parseFloat(item.price) * item.qty) * rate;
                }
            });
        }
        

        let discountAmount = 0;
        let voucherWarningMessage = '';
        const activeVoucherCode = localStorage.getItem('activeVoucherCode');
        let activeVoucher = null;

        if (activeVoucherCode) {
            if (user && user.vouchers) {
                activeVoucher = user.vouchers.find(v => v.code === activeVoucherCode);
            }
            if (activeVoucher && !activeVoucher.used) {
                const discountResult = this.calculateDiscount(activeVoucher, subtotal, shippingCost);
                discountAmount = discountResult.amount;
                if (!discountResult.success) { 
                    voucherWarningMessage = discountResult.message;
                }
            } else {
                localStorage.removeItem('activeVoucherCode'); 
            }
        }

        const grandTotal = Math.max(0, subtotal + shippingCost - discountAmount - tierDiscount - accessoryDiscount);
        
       
        cartSummary.innerHTML = `
            <div class="coupon-section">
                <input type="text" id="voucherInput" class="coupon-input" placeholder="${isJp ? 'クーポンコード' : 'Voucher Code'}" value="${activeVoucherCode || ''}">
                <button id="applyVoucherBtn" class="sakura-btn" style="padding: 8px 18px; font-size: 14px; margin: 0;">${isJp ? '適用' : 'Apply'}</button>
                ${activeVoucherCode ? `<button id="removeVoucherBtn" class="remove-btn" style="padding: 8px 18px; font-size: 14px; margin: 0;">${isJp ? '削除' : 'Remove'}</button>` : ''}
            </div>
            ${voucherWarningMessage ? `<div class="voucher-warning">${voucherWarningMessage}</div>` : ''}
            <div class="p-2 mb-3 rounded-3" style="background: rgba(255,101,163,0.05); border: 1px solid rgba(255,101,163,0.1);">
                <div class="small fw-bold mb-1" style="color: var(--sakura-pink-dark); font-size: 11px;"><span class="me-1">${tier.icon}</span> ${tier.name} ${isJp ? '特典' : 'Tier Rewards'}</div> 
                ${tierDiscount > 0 ? `<div class="d-flex justify-content-between small"><span>${isJp ? '季節限定割引 (5%)' : 'Seasonal Discount (5%)'}</span><span class="text-success">-${formatPrice(tierDiscount)}</span></div>` : ''}
                ${accessoryDiscount > 0 ? `<div class="d-flex justify-content-between small"><span>${isJp ? 'Petal 特典: アクセサリー割引 (10%)' : 'Petal Bonus: Accessory Discount (10%)'}</span><span class="text-success">-${formatPrice(accessoryDiscount)}</span></div>` : ''}
                ${tier.name === 'Sprout' ? `<div class="small opacity-50">${isJp ? '500ptで特典アンロック' : 'Unlock rewards at 500pts'}</div>` : ''}
            </div>
            <p class="cart-total-label">${isJp ? '小計' : 'Subtotal'}: <span class="fw-bold">${formatPrice(subtotal)}</span></p>
            <p class="cart-total-label">${isJp ? '送料' : 'Shipping'}: <span class="fw-bold">${shippingCost === 0 ? (isJp ? '無料' : 'FREE') : formatPrice(shippingCost)}</span></p>
            ${(tierDiscount + accessoryDiscount) > 0 ? `<p class="cart-total-label">${isJp ? 'ランク特典割引' : 'Rank Discount'}: <span class="fw-bold discount-text">-${formatPrice(tierDiscount + accessoryDiscount)}</span></p>` : ''}
            ${discountAmount > 0 ? `<p class="cart-total-label">${isJp ? '割引' : 'Discount'}: <span class="fw-bold discount-text">-${formatPrice(discountAmount)}</span></p>` : ''}
            <p class="cart-total-label">${isJp ? '合計' : 'Total'}: <span class="cart-total-price">${formatPrice(grandTotal)}</span></p>
            <div class="cart-summary-actions">
                <a href="checkout.html" class="checkout-btn">${isJp ? 'レジに進む' : 'Checkout'}</a>
            </div>
        `; 

        
        document.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const title = e.target.dataset.title;
                const action = e.target.dataset.action;
                let currentCart = getCart();
                const itemIndex = currentCart.findIndex(item => item.title === title);

                if (itemIndex > -1) {
                    if (action === 'increase') {
                        currentCart[itemIndex].qty++; 
                    } else if (action === 'decrease') {
                        currentCart[itemIndex].qty--;
                        if (currentCart[itemIndex].qty <= 0) {
                            currentCart.splice(itemIndex, 1); 
                        }
                    }
                    saveCart(currentCart);
                    this.renderCart();
                }
            });
        }); 

      
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const title = e.target.dataset.title;
                let currentCart = getCart();
              
                currentCart = currentCart.filter(item => item && item.title && item.title !== title);
                saveCart(currentCart);
                this.renderCart();
            });
        }); 

   
        document.getElementById('applyVoucherBtn')?.addEventListener('click', () => {
            const voucherInput = document.getElementById('voucherInput');
            if (voucherInput && voucherInput.value) {
                this.applyVoucher(voucherInput.value.trim());
            }
        }); 

        document.getElementById('removeVoucherBtn')?.addEventListener('click', () => {
            this.removeVoucher();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => QuickView.init());

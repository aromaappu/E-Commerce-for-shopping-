(function () {
    const KEY = "tm_cart_v1";
    const TTL = 6 * 60 * 60 * 1000;

    function read() {
        try {
            const raw = localStorage.getItem(KEY);
            const arr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) return [];
            const now = Date.now();
            const fresh = arr.filter(function (i) {
                const t = i.addedAt || now;
                return (now - t) < TTL;
            });
            if (fresh.length !== arr.length) {
                localStorage.setItem(KEY, JSON.stringify(fresh));
            }
            return fresh;
        } catch (e) {
            return [];
        }
    }

    function save(items) {
        localStorage.setItem(KEY, JSON.stringify(items));
        updateBadges();
    }

    function add(product) {
        const items = read();
        const existing = items.find(function (i) {
            return i.id === product.id;
        });
        if (existing) {
            existing.qty += 1;
            existing.addedAt = Date.now();
        } else {
            items.push({
                id: product.id,
                code: product.code,
                name: product.name,
                price: product.price,
                img: product.img,
                qty: 1,
                addedAt: Date.now()
            });
        }
        save(items);
        showToast(product.name + " added to cart");
    }

    function remove(id) {
        save(read().filter(function (i) { return i.id !== id; }));
    }

    function setQty(id, qty) {
        const items = read();
        const it = items.find(function (i) { return i.id === id; });
        if (!it) return;
        it.qty = Math.max(1, parseInt(qty, 10) || 1);
        save(items);
    }

    function getCount() {
        return read().reduce(function (n, i) { return n + i.qty; }, 0);
    }

    function getItems() {
        return read();
    }

    function getTotal() {
        return read().reduce(function (t, i) {
            const p = parseFloat(String(i.price).replace(/[^0-9.]/g, ""));
            return t + (isNaN(p) ? 0 : p) * i.qty;
        }, 0);
    }

    function clear() {
        save([]);
    }

    function formatTotal() {
        return "₹" + getTotal().toLocaleString("en-IN");
    }

    function updateBadges() {
        const count = getCount();
        document.querySelectorAll("[data-cart-badge]").forEach(function (el) {
            el.textContent = count > 99 ? "99+" : String(count);
            el.style.display = count > 0 ? "flex" : "none";
        });
    }

    function showToast(msg) {
        let toast = document.getElementById("tm-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "tm-toast";
            toast.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:10px 18px;border-radius:8px;font-size:14px;z-index:99999;max-width:80vw;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.3);";
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.transition = "opacity .25s";
        toast.style.opacity = "1";
        clearTimeout(toast._t);
        toast._t = setTimeout(function () {
            toast.style.opacity = "0";
        }, 2000);
    }

    function mountFloatingCart() {
        if (document.getElementById("tm-cart-fab")) return;
        const base = window.TM_BASE || "";
        const fab = document.createElement("a");
        fab.id = "tm-cart-fab";
        fab.href = base + "cart.html";
        fab.setAttribute("aria-label", "View cart");
        fab.innerHTML =
            '<span style="font-size:22px;line-height:1;">🛒</span>' +
            '<span data-cart-badge id="tm-cart-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#e63946;color:#fff;border-radius:50%;min-width:20px;height:20px;font-size:12px;align-items:center;justify-content:center;padding:0 4px;">0</span>';
        fab.style.cssText = "position:fixed;bottom:90px;right:15px;width:56px;height:56px;border-radius:50%;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.3);z-index:9998;text-decoration:none;";
        document.body.appendChild(fab);
        updateBadges();
    }

    function mountHeaderBadge() {
        document.querySelectorAll(".header-cart-icon").forEach(function (el) {
            el.style.display = "flex";
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        mountFloatingCart();
        mountHeaderBadge();
    });

    window.TMCart = {
        add: add,
        remove: remove,
        setQty: setQty,
        getCount: getCount,
        getItems: getItems,
        getTotal: getTotal,
        formatTotal: formatTotal,
        clear: clear,
        showToast: showToast,
        updateBadges: updateBadges
    };
})();

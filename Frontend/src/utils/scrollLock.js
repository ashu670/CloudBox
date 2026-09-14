// Reference-counted body scroll lock utility for stacked modals, sidebars, and overlays
export const lockBodyScroll = () => {
    if (typeof document === "undefined") return;
    const current = Number(document.body.dataset.modalCount || 0);
    const next = current + 1;
    document.body.dataset.modalCount = String(next);
    document.body.style.overflow = "hidden";
};

export const unlockBodyScroll = () => {
    if (typeof document === "undefined") return;
    const current = Number(document.body.dataset.modalCount || 0);
    const next = Math.max(0, current - 1);
    document.body.dataset.modalCount = String(next);
    if (next === 0) {
        document.body.style.overflow = "";
    }
};

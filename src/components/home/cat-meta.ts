// Category metadata shared by the desktop finder and the mobile finder.
// ── Category metadata for the horizontal "row" view ──────────────────────────
export const CAT_SHORT: Record<string, string> = {
  "varosi-kisauto":   "Kisautó",
  "mini-suv":         "Mini SUV",
  "kompakt-suv":      "Kompakt SUV",
  "kozepmeretu-suv":  "Közép SUV",
  "nagy-suv":         "Nagy SUV",
  "kompakt-ferdehatu":"Ferdehátú",
  "kombi":            "Kombi",
  "sedan":            "Szedán",
  "premium-limuzin":  "Limuzin",
  "mpv":              "Egyterű",
  "roadster":         "Roadster",
  "pickup":           "Pickup",
};

// icon-number matches the user-specified order (1=Kisautó … 12=Pickup)
export const CAT_ICON: Record<string, string> = {
  "varosi-kisauto":   "/cat-icons/1varosikisauto.png",
  "mini-suv":         "/cat-icons/2MiniSuv.png",
  "kompakt-suv":      "/cat-icons/3KompaktSUV.png",
  "kozepmeretu-suv":  "/cat-icons/4KozepSuv.png",
  "nagy-suv":         "/cat-icons/5NagySuv.png",
  "kompakt-ferdehatu":"/cat-icons/6Ferdehatu.png",
  "kombi":            "/cat-icons/7Sedan.png",
  "sedan":            "/cat-icons/8Kombi.png",
  "premium-limuzin":  "/cat-icons/9Limuzin.png",
  "mpv":              "/cat-icons/10Egyteru.png",
  "roadster":         "/cat-icons/11Roadster.png",
  "pickup":           "/cat-icons/12PickUp.png",
};

export const CAT_ROW_ORDER: Record<string, number> = {
  "varosi-kisauto": 1, "mini-suv": 2, "kompakt-suv": 3,
  "kozepmeretu-suv": 4, "nagy-suv": 5, "kompakt-ferdehatu": 6,
  "kombi": 7, "sedan": 8, "premium-limuzin": 9,
  "mpv": 10, "roadster": 11, "pickup": 12,
};


package main

import (
	"fmt"
	"html"
	"os"
	"path/filepath"
	"strings"

	"mini-ecommerce/config"
	"mini-ecommerce/models"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

const productsPerCategory = 100

type catalogCategory struct {
	name     string
	slug     string
	icon     string
	price    int
	products []string
}

var catalogCategories = []catalogCategory{
	{name: "Audio & Earbuds", slug: "audio", icon: "earbuds", price: 189000, products: []string{"Earbuds", "Headphone", "Headset", "Speaker", "Neckband", "Mic Clip", "Audio DAC", "Soundbar", "Ear Monitor", "Mic Wireless"}},
	{name: "Ponsel & Tablet", slug: "ponsel", icon: "phone", price: 799000, products: []string{"Smartphone", "Tablet", "Phone Mini", "Tablet Air", "Phone Max", "E-Reader", "Phone Lite", "Tablet Pro", "Phone Fold", "Pocket Phone"}},
	{name: "Komputer & Laptop", slug: "komputer", icon: "laptop", price: 1499000, products: []string{"Laptop", "Ultrabook", "Mini PC", "Monitor", "Keyboard", "Mouse", "Webcam", "USB Hub", "Laptop Stand", "Mechanical Keys"}},
	{name: "Wearable & Jam", slug: "wearable", icon: "watch", price: 249000, products: []string{"Smartwatch", "Fitness Band", "Watch Classic", "Watch Active", "Smart Ring", "Sport Watch", "Kids Watch", "Watch Pro", "Sleep Band", "Watch Mini"}},
	{name: "Gaming", slug: "gaming", icon: "gaming", price: 159000, products: []string{"Gamepad", "Gaming Headset", "Gaming Mouse", "Gaming Keyboard", "Controller Pro", "Desk Mat", "Game Capture", "Arcade Stick", "Gaming Mic", "Portable Console"}},
	{name: "Kamera & Drone", slug: "kamera", icon: "camera", price: 599000, products: []string{"Action Camera", "Drone Mini", "Web Camera", "Mirrorless Cam", "Pocket Gimbal", "Camera Lens", "Dash Camera", "Tripod Pro", "Drone Air", "Instant Camera"}},
	{name: "Smart Home", slug: "smart-home", icon: "home", price: 99000, products: []string{"Smart Lamp", "Smart Plug", "WiFi Camera", "Motion Sensor", "Smart Bulb", "Door Sensor", "Smart Display", "Air Monitor", "LED Strip", "Smart Switch"}},
	{name: "Aksesori Gadget", slug: "aksesori", icon: "accessory", price: 49000, products: []string{"Phone Case", "Screen Guard", "Laptop Sleeve", "Cable Organizer", "Phone Grip", "Tablet Pen", "Foldable Stand", "Camera Strap", "Travel Pouch", "Desk Dock"}},
	{name: "Power & Charging", slug: "power", icon: "power", price: 79000, products: []string{"Power Bank", "Fast Charger", "Wireless Charger", "USB-C Cable", "Car Charger", "Charging Dock", "GaN Adapter", "Solar Charger", "Battery Pack", "Multi Charger"}},
	{name: "Audio Rumah", slug: "audio-rumah", icon: "speaker", price: 229000, products: []string{"Bluetooth Speaker", "Party Speaker", "Bookshelf Speaker", "Smart Speaker", "Studio Monitor", "Portable Radio", "Turntable", "Soundbar Plus", "Karaoke Mic", "Home Subwoofer"}},
}

var seriesNames = []string{
	"Pulse", "Orbit", "Nova", "Lumen", "Vertex",
	"Echo", "Astra", "Flux", "Halo", "Terra",
}

var productColors = [][3]string{
	{"#2563eb", "#93c5fd", "#dbeafe"},
	{"#7c3aed", "#c4b5fd", "#ede9fe"},
	{"#0891b2", "#67e8f9", "#cffafe"},
	{"#059669", "#6ee7b7", "#d1fae5"},
	{"#db2777", "#f9a8d4", "#fce7f3"},
	{"#ea580c", "#fdba74", "#ffedd5"},
	{"#4f46e5", "#a5b4fc", "#e0e7ff"},
	{"#0f766e", "#5eead4", "#ccfbf1"},
	{"#be123c", "#fda4af", "#ffe4e6"},
	{"#475569", "#cbd5e1", "#f1f5f9"},
}

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Fprintf(os.Stderr, "load backend .env: %v\n", err)
		os.Exit(1)
	}

	db, err := config.InitDB()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if err := db.AutoMigrate(&models.Category{}, &models.Product{}); err != nil {
		fmt.Fprintf(os.Stderr, "migrate catalog tables: %v\n", err)
		os.Exit(1)
	}

	created, skipped, err := seedCatalog(db)
	if err != nil {
		fmt.Fprintf(os.Stderr, "seed catalog: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Catalog ready: %d products added, %d already present, %d categories.\n", created, skipped, len(catalogCategories))
}

func seedCatalog(db *gorm.DB) (int, int, error) {
	categoryIDs := make(map[string]uint, len(catalogCategories))
	for _, definition := range catalogCategories {
		category := models.Category{Name: definition.name}
		if err := db.Where("name = ?", definition.name).FirstOrCreate(&category).Error; err != nil {
			return 0, 0, fmt.Errorf("ensure category %q: %w", definition.name, err)
		}
		categoryIDs[definition.name] = category.ID
	}

	products := make([]models.Product, 0, len(catalogCategories)*productsPerCategory)
	names := make([]string, 0, cap(products))
	for _, definition := range catalogCategories {
		for index := 0; index < productsPerCategory; index++ {
			name := fmt.Sprintf("Native %s %s %03d", seriesNames[index/10], definition.products[index%len(definition.products)], index+1)
			names = append(names, name)
			products = append(products, models.Product{
				Name:        name,
				Description: fmt.Sprintf("%s pilihan untuk menemani aktivitas harian, dengan desain praktis dan kualitas yang nyaman digunakan.", definition.products[index%len(definition.products)]),
				Price:       definition.price + (index%10)*25000,
				Stock:       5 + (index*7)%36,
				Image:       filepath.ToSlash(filepath.Join("uploads", "products", fmt.Sprintf("native-%s-%03d.svg", definition.slug, index+1))),
				CategoryID:  categoryIDs[definition.name],
			})
		}
	}

	var existingProducts []models.Product
	if err := db.Select("name").Where("name IN ?", names).Find(&existingProducts).Error; err != nil {
		return 0, 0, fmt.Errorf("check existing seeded products: %w", err)
	}
	existingNames := make(map[string]struct{}, len(existingProducts))
	for _, product := range existingProducts {
		existingNames[product.Name] = struct{}{}
	}

	productsToCreate := make([]models.Product, 0, len(products))
	for index, product := range products {
		if _, exists := existingNames[product.Name]; exists {
			continue
		}
		productsToCreate = append(productsToCreate, product)
		if err := writeProductImage(product.Image, product.Name, catalogCategories[index/productsPerCategory]); err != nil {
			return 0, 0, err
		}
	}

	if len(productsToCreate) == 0 {
		return 0, len(products), nil
	}
	if err := db.Transaction(func(tx *gorm.DB) error {
		return tx.CreateInBatches(productsToCreate, 100).Error
	}); err != nil {
		return 0, 0, fmt.Errorf("insert catalog products: %w", err)
	}
	return len(productsToCreate), len(products) - len(productsToCreate), nil
}

func writeProductImage(path, name string, definition catalogCategory) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("create product image directory: %w", err)
	}
	escapedName := html.EscapeString(name)
	colors := productColors[len(name)%len(productColors)]
	icon := productIllustration(definition.icon, colors[0], colors[1])
	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="520" viewBox="0 0 640 520">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient><filter id="shadow" x="-.3" y="-.3" width="1.6" height="1.8"><feDropShadow dx="0" dy="20" stdDeviation="16" flood-color="#0f172a" flood-opacity=".18"/></filter></defs>
<rect width="640" height="520" rx="40" fill="%s"/><circle cx="510" cy="102" r="132" fill="#fff" fill-opacity=".35"/><circle cx="92" cy="448" r="164" fill="#fff" fill-opacity=".28"/><path d="M0 378c130-102 222 46 345-6s204-100 295-34v182H0z" fill="#fff" fill-opacity=".28"/>
<g filter="url(#shadow)" transform="translate(0 -24)">%s</g>
<rect x="32" y="438" width="576" height="54" rx="18" fill="#fff" fill-opacity=".88"/><text x="54" y="472" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#0f172a">%s</text>
<text x="585" y="472" text-anchor="end" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="%s">NATIVE</text></svg>`,
		colors[1], colors[2], colors[2], icon, escapedName, colors[0])
	if err := os.WriteFile(path, []byte(svg), 0o644); err != nil {
		return fmt.Errorf("write product image %q: %w", filepath.Base(path), err)
	}
	return nil
}

func productIllustration(kind, primary, accent string) string {
	switch strings.ToLower(kind) {
	case "earbuds":
		return fmt.Sprintf(`<rect x="176" y="166" width="288" height="188" rx="82" fill="#0f172a"/><rect x="194" y="181" width="252" height="145" rx="68" fill="#1e293b"/><path d="M254 130v96a31 31 0 0 0 62 0v-32h-34v32a8 8 0 0 1-16 0v-96a22 22 0 0 0-44 0v28h22zM360 130v96a31 31 0 0 0 62 0v-32h-34v32a8 8 0 0 1-16 0v-96a22 22 0 0 0-44 0v28h22z" fill="%s"/><circle cx="246" cy="280" r="10" fill="%s"/><circle cx="394" cy="280" r="10" fill="%s"/>`, primary, accent, accent)
	case "phone":
		return fmt.Sprintf(`<rect x="226" y="84" width="188" height="316" rx="34" fill="#0f172a"/><rect x="238" y="99" width="164" height="283" rx="24" fill="url(#bg)"/><path d="M255 290c35-76 99-122 145-127v219H255z" fill="%s" fill-opacity=".45"/><rect x="254" y="116" width="68" height="62" rx="20" fill="#0f172a"/><circle cx="277" cy="139" r="12" fill="url(#glass)"/><circle cx="300" cy="158" r="10" fill="url(#glass)"/><rect x="307" y="91" width="26" height="4" rx="2" fill="#64748b"/>`, primary)
	case "laptop":
		return fmt.Sprintf(`<rect x="168" y="104" width="304" height="206" rx="18" fill="#0f172a"/><rect x="182" y="118" width="276" height="178" rx="10" fill="url(#bg)"/><path d="M202 263c70-94 144-92 236-22v50H202z" fill="%s" fill-opacity=".6"/><path d="M132 320h376l-34 42H166z" fill="#334155"/><rect x="258" y="326" width="124" height="7" rx="4" fill="#94a3b8"/><circle cx="320" cy="109" r="3" fill="#cbd5e1"/>`, primary)
	case "watch":
		return fmt.Sprintf(`<rect x="266" y="80" width="108" height="110" rx="30" fill="%s"/><rect x="266" y="304" width="108" height="110" rx="30" fill="%s"/><rect x="218" y="154" width="204" height="198" rx="54" fill="#0f172a"/><rect x="235" y="171" width="170" height="164" rx="40" fill="url(#bg)"/><circle cx="320" cy="253" r="48" fill="none" stroke="url(#glass)" stroke-width="9"/><path d="M320 218v38l26 20" fill="none" stroke="url(#glass)" stroke-width="8" stroke-linecap="round"/><circle cx="320" cy="253" r="7" fill="%s"/>`, primary, primary, accent)
	case "gaming":
		return fmt.Sprintf(`<path d="M205 188c8-38 35-62 70-62h90c35 0 62 24 70 62l31 130c9 38-21 61-51 39l-70-53h-50l-70 53c-30 22-60-1-51-39z" fill="#0f172a"/><path d="M242 207v72m-36-36h72" stroke="%s" stroke-width="13" stroke-linecap="round"/><circle cx="396" cy="226" r="11" fill="%s"/><circle cx="420" cy="262" r="11" fill="%s"/><circle cx="360" cy="260" r="7" fill="#94a3b8"/><circle cx="385" cy="285" r="7" fill="#94a3b8"/>`, primary, primary, accent)
	case "camera":
		return fmt.Sprintf(`<path d="M230 146l24-44h132l24 44h32a30 30 0 0 1 30 30v172a30 30 0 0 1-30 30H198a30 30 0 0 1-30-30V176a30 30 0 0 1 30-30z" fill="#0f172a"/><circle cx="320" cy="250" r="84" fill="#334155"/><circle cx="320" cy="250" r="64" fill="%s"/><circle cx="320" cy="250" r="43" fill="#0f172a"/><circle cx="304" cy="232" r="17" fill="url(#glass)"/><circle cx="416" cy="184" r="9" fill="%s"/><rect x="211" y="167" width="36" height="12" rx="6" fill="#64748b"/>`, primary, accent)
	case "home":
		return fmt.Sprintf(`<path d="M320 88c-73 0-118 57-111 123 5 42 32 63 45 100h132c13-37 40-58 45-100 7-66-38-123-111-123z" fill="#0f172a"/><path d="M253 212c0-38 29-68 67-68" fill="none" stroke="%s" stroke-width="13" stroke-linecap="round"/><path d="M276 322h88v24a20 20 0 0 1-20 20h-48a20 20 0 0 1-20-20z" fill="%s"/><path d="M292 384h56" stroke="#334155" stroke-width="14" stroke-linecap="round"/>`, primary, accent)
	case "accessory":
		return fmt.Sprintf(`<path d="M240 169v-25a80 80 0 0 1 160 0v25" fill="none" stroke="#334155" stroke-width="24" stroke-linecap="round"/><rect x="204" y="160" width="82" height="142" rx="30" fill="%s"/><rect x="354" y="160" width="82" height="142" rx="30" fill="%s"/><rect x="229" y="181" width="33" height="65" rx="14" fill="url(#glass)"/><rect x="379" y="181" width="33" height="65" rx="14" fill="url(#glass)"/><circle cx="245" cy="332" r="17" fill="#0f172a"/><circle cx="395" cy="332" r="17" fill="#0f172a"/>`, primary, accent)
	case "power":
		return fmt.Sprintf(`<rect x="203" y="156" width="234" height="146" rx="38" fill="#0f172a"/><rect x="222" y="175" width="196" height="108" rx="28" fill="url(#bg)"/><rect x="246" y="205" width="102" height="46" rx="12" fill="#fff" fill-opacity=".82"/><path d="M296 210l-19 21h20l-8 16 28-28h-21z" fill="%s"/><rect x="447" y="207" width="17" height="42" rx="7" fill="#334155"/><circle cx="375" cy="228" r="7" fill="%s"/>`, primary, accent)
	default:
		return fmt.Sprintf(`<rect x="224" y="133" width="192" height="192" rx="52" fill="#0f172a"/><rect x="242" y="151" width="156" height="156" rx="40" fill="url(#bg)"/><circle cx="320" cy="229" r="53" fill="%s" fill-opacity=".75"/><circle cx="320" cy="229" r="27" fill="#0f172a"/><circle cx="309" cy="218" r="10" fill="url(#glass)"/><rect x="276" y="344" width="88" height="12" rx="6" fill="#334155"/>`, primary)
	}
}

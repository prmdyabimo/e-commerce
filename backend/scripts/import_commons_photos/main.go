package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"mini-ecommerce/config"
	"mini-ecommerce/models"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

type licensedProductPhoto struct {
	category     string
	filename     string
	title        string
	artist       string
	license      string
	licenseURL   string
	sourceURL    string
	thumbnailURL string
}

type photoAttribution struct {
	Category   string `json:"category"`
	File       string `json:"file"`
	Title      string `json:"title"`
	Artist     string `json:"artist"`
	License    string `json:"license"`
	LicenseURL string `json:"license_url"`
	SourceURL  string `json:"source_url"`
}

var productPhotos = []licensedProductPhoto{
	{
		category: "Audio & Earbuds", filename: "native-real-audio.jpg",
		title: "Google Pixel Buds (2017)", artist: "Mliu92",
		license: "CC BY-SA 3.0", licenseURL: "https://creativecommons.org/licenses/by-sa/3.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:Google_Pixel_Buds_(2017).jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Google_Pixel_Buds_%282017%29.jpg/960px-Google_Pixel_Buds_%282017%29.jpg",
	},
	{
		category: "Ponsel & Tablet", filename: "native-real-ponsel.jpg",
		title: "Nokia Lumia 620", artist: "shubs",
		license: "CC BY-SA 3.0", licenseURL: "https://creativecommons.org/licenses/by-sa/3.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:Nokia_Lumia_620.JPG",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Nokia_Lumia_620.JPG/960px-Nokia_Lumia_620.JPG",
	},
	{
		category: "Komputer & Laptop", filename: "native-real-komputer.png",
		title: "Acer Aspire 5250", artist: "AnVuong1222004",
		license: "CC BY-SA 4.0", licenseURL: "https://creativecommons.org/licenses/by-sa/4.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:Acer_Aspire_5250.png",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a6/Acer_Aspire_5250.png/960px-Acer_Aspire_5250.png",
	},
	{
		category: "Wearable & Jam", filename: "native-real-wearable.jpg",
		title: "Garmin Forerunner 55", artist: "Melyanac",
		license: "CC0", licenseURL: "https://creativecommons.org/publicdomain/zero/1.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:Garmin_Forerunner_55.jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Garmin_Forerunner_55.jpg/960px-Garmin_Forerunner_55.jpg",
	},
	{
		category: "Gaming", filename: "native-real-gaming.jpg",
		title: "InclusiveGameLab Xbox Controller 1", artist: "InclusiveGameLab",
		license: "CC BY-SA 4.0", licenseURL: "https://creativecommons.org/licenses/by-sa/4.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:InclusiveGameLab_2-Xbox-Controller_1_CC-BY-SA.jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/InclusiveGameLab_2-Xbox-Controller_1_CC-BY-SA.jpg/960px-InclusiveGameLab_2-Xbox-Controller_1_CC-BY-SA.jpg",
	},
	{
		category: "Kamera & Drone", filename: "native-real-kamera.jpg",
		title: "Black Canon DSLR camera", artist: "parth7878",
		license: "CC BY-SA 4.0", licenseURL: "https://creativecommons.org/licenses/by-sa/4.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:Black-canon-dslr-camera.jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Black-canon-dslr-camera.jpg/960px-Black-canon-dslr-camera.jpg",
	},
	{
		category: "Smart Home", filename: "native-real-smart-home.jpg",
		title: "Amazon Echo", artist: "Frmorrison",
		license: "CC BY-SA 3.0", licenseURL: "https://creativecommons.org/licenses/by-sa/3.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:Amazon_Echo.jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Amazon_Echo.jpg/960px-Amazon_Echo.jpg",
	},
	{
		category: "Aksesori Gadget", filename: "native-real-aksesori.jpg",
		title: "A computer keyboard and mouse on a desk", artist: "Shixart1985",
		license: "CC BY 2.0", licenseURL: "https://creativecommons.org/licenses/by/2.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:A_computer_keyboard_and_mouse_are_positioned_on_a_wooden_des.jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/A_computer_keyboard_and_mouse_are_positioned_on_a_wooden_des.jpg/960px-A_computer_keyboard_and_mouse_are_positioned_on_a_wooden_des.jpg",
	},
	{
		category: "Power & Charging", filename: "native-real-power.jpg",
		title: "Sony CP-VC10 power bank", artist: "Dinkun Chen",
		license: "CC BY-SA 4.0", licenseURL: "https://creativecommons.org/licenses/by-sa/4.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:SONY_CP-VC10_POWER_BANK.jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/SONY_CP-VC10_POWER_BANK.jpg/960px-SONY_CP-VC10_POWER_BANK.jpg",
	},
	{
		category: "Audio Rumah", filename: "native-real-audio-rumah.jpg",
		title: "Beats By Dr. Dre Pill Portable Bluetooth Speaker Black", artist: "Beats",
		license: "CC0", licenseURL: "https://creativecommons.org/publicdomain/zero/1.0/",
		sourceURL:    "https://commons.wikimedia.org/wiki/File:Beats_By_Dr._Dre_Pill_Portable_Bluetooth_Speaker_Black_N2.jpg",
		thumbnailURL: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Beats_By_Dr._Dre_Pill_Portable_Bluetooth_Speaker_Black_N2.jpg/960px-Beats_By_Dr._Dre_Pill_Portable_Bluetooth_Speaker_Black_N2.jpg",
	},
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

	imageDir := filepath.Join("uploads", "products")
	if err := os.MkdirAll(imageDir, 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "create product image directory: %v\n", err)
		os.Exit(1)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	attributions := make([]photoAttribution, 0, len(productPhotos))
	for _, photo := range productPhotos {
		if err := downloadProductPhoto(client, imageDir, photo); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		attributions = append(attributions, photoAttribution{
			Category:   photo.category,
			File:       filepath.ToSlash(filepath.Join("uploads", "products", photo.filename)),
			Title:      photo.title,
			Artist:     photo.artist,
			License:    photo.license,
			LicenseURL: photo.licenseURL,
			SourceURL:  photo.sourceURL,
		})
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		for _, photo := range productPhotos {
			var category models.Category
			if err := tx.Where("name = ?", photo.category).First(&category).Error; err != nil {
				return fmt.Errorf("find category %q: %w", photo.category, err)
			}
			result := tx.Model(&models.Product{}).
				Where("category_id = ?", category.ID).
				Update("image", filepath.ToSlash(filepath.Join("uploads", "products", photo.filename)))
			if result.Error != nil {
				return fmt.Errorf("update photos for %q: %w", photo.category, result.Error)
			}
			if result.RowsAffected == 0 {
				return fmt.Errorf("no products found in category %q", photo.category)
			}
			fmt.Printf("%s: updated %d product images\n", photo.category, result.RowsAffected)
		}
		return nil
	}); err != nil {
		fmt.Fprintf(os.Stderr, "update product images: %v\n", err)
		os.Exit(1)
	}

	manifestPath := filepath.Join(imageDir, "commons-attribution.json")
	manifest, err := json.MarshalIndent(attributions, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "encode image attribution manifest: %v\n", err)
		os.Exit(1)
	}
	if err := os.WriteFile(manifestPath, append(manifest, '\n'), 0o644); err != nil {
		fmt.Fprintf(os.Stderr, "write image attribution manifest: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Downloaded %d representative Wikimedia Commons photos. Attribution: %s\n", len(attributions), manifestPath)
}

func downloadProductPhoto(client *http.Client, imageDir string, photo licensedProductPhoto) error {
	request, err := http.NewRequest(http.MethodGet, photo.thumbnailURL, nil)
	if err != nil {
		return fmt.Errorf("create image request for %q: %w", photo.title, err)
	}
	request.Header.Set("User-Agent", "native.co product catalog/1.0")
	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("download image %q: %w", photo.title, err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("download image %q: Wikimedia returned HTTP %d", photo.title, response.StatusCode)
	}
	contentType := strings.ToLower(response.Header.Get("Content-Type"))
	if !strings.HasPrefix(contentType, "image/") {
		return fmt.Errorf("download image %q: unexpected content type %q", photo.title, contentType)
	}
	image, err := io.ReadAll(io.LimitReader(response.Body, 12<<20))
	if err != nil {
		return fmt.Errorf("read image %q: %w", photo.title, err)
	}
	if len(image) == 0 || len(image) >= 12<<20 {
		return fmt.Errorf("download image %q: empty or larger than 12 MB", photo.title)
	}
	if err := os.WriteFile(filepath.Join(imageDir, photo.filename), image, 0o644); err != nil {
		return fmt.Errorf("save image %q: %w", photo.title, err)
	}
	return nil
}

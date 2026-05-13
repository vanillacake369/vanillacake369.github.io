package converter

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var httpClient = &http.Client{Timeout: 30 * time.Second}

// ImageDownloader downloads remote images to a local directory
type ImageDownloader struct {
	// OutDir is the filesystem path to save images (e.g. "public/images/velog")
	OutDir string
	// URLPrefix is the URL prefix for markdown references (e.g. "/images/velog")
	URLPrefix string
}

// Download fetches a remote image and returns the local URL path.
// Returns the original URL on failure (graceful fallback).
func (d *ImageDownloader) Download(remoteURL string) string {
	if d == nil || d.OutDir == "" || remoteURL == "" {
		return remoteURL
	}

	hash := sha256.Sum256([]byte(remoteURL))
	shortHash := hex.EncodeToString(hash[:8])
	ext := path.Ext(strings.SplitN(remoteURL, "?", 2)[0])
	if ext == "" || len(ext) > 6 {
		ext = ".png"
	}
	filename := shortHash + ext
	outPath := filepath.Join(d.OutDir, filename)

	// Skip if already downloaded
	if _, err := os.Stat(outPath); err == nil {
		return d.URLPrefix + "/" + filename
	}

	if err := os.MkdirAll(d.OutDir, 0o755); err != nil {
		return remoteURL
	}

	resp, err := httpClient.Get(remoteURL)
	if err != nil || resp.StatusCode != 200 {
		return remoteURL
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return remoteURL
	}

	if err := os.WriteFile(outPath, data, 0o644); err != nil {
		return remoteURL
	}

	return d.URLPrefix + "/" + filename
}

// Markdown image pattern: ![alt](url)
var mdImageRe = regexp.MustCompile(`(!\[[^\]]*\])\(([^)]+)\)`)

// ReplaceMarkdownImages finds all image URLs in markdown and downloads them locally.
func (d *ImageDownloader) ReplaceMarkdownImages(markdown string) string {
	if d == nil || d.OutDir == "" {
		return markdown
	}
	return mdImageRe.ReplaceAllStringFunc(markdown, func(match string) string {
		parts := mdImageRe.FindStringSubmatch(match)
		if len(parts) < 3 {
			return match
		}
		altPart := parts[1] // ![alt]
		url := parts[2]

		// Only download http(s) URLs
		if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
			return match
		}

		localURL := d.Download(url)
		return altPart + "(" + localURL + ")"
	})
}

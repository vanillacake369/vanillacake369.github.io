package converter

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// PostData is the unified representation for a blog post to be written
type PostData struct {
	Title       string
	Description string
	Date        time.Time
	UpdatedDate *time.Time
	Tags        []string
	Category    string
	Lang        string
	Draft       bool
	Body        string
	Source      string // "notion" or "velog"
}

// ToMarkdown generates a complete Astro-compatible markdown file
func (p *PostData) ToMarkdown() string {
	var sb strings.Builder

	sb.WriteString("---\n")
	sb.WriteString(fmt.Sprintf("title: %q\n", p.Title))
	sb.WriteString(fmt.Sprintf("description: %q\n", p.Description))
	sb.WriteString(fmt.Sprintf("date: %s\n", p.Date.Format("2006-01-02")))
	if p.UpdatedDate != nil {
		sb.WriteString(fmt.Sprintf("updatedDate: %s\n", p.UpdatedDate.Format("2006-01-02")))
	}
	if len(p.Tags) > 0 {
		sb.WriteString(fmt.Sprintf("tags: [%s]\n", strings.Join(p.Tags, ", ")))
	} else {
		sb.WriteString("tags: []\n")
	}
	cat := p.Category
	if cat == "" {
		cat = "uncategorized"
	}
	sb.WriteString(fmt.Sprintf("category: %s\n", cat))
	lang := p.Lang
	if lang == "" {
		lang = "ko"
	}
	sb.WriteString(fmt.Sprintf("lang: %s\n", lang))
	sb.WriteString(fmt.Sprintf("draft: %t\n", p.Draft))
	sb.WriteString("---\n\n")

	sb.WriteString(strings.TrimSpace(p.Body))
	sb.WriteString("\n")

	return sb.String()
}

// SanitizeFilename creates a safe filename from a title
func SanitizeFilename(title string) string {
	// Keep Korean characters, alphanumeric, spaces, and hyphens
	re := regexp.MustCompile(`[^\p{L}\p{N}\s\-]`)
	name := re.ReplaceAllString(title, "")
	// Collapse multiple spaces
	name = regexp.MustCompile(`\s+`).ReplaceAllString(name, " ")
	return strings.TrimSpace(name)
}

package notion

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

const apiBase = "https://api.notion.com/v1"
const apiVersion = "2022-06-28"

type Client struct {
	token      string
	httpClient *http.Client
	// ImageDir is the local directory to download images into (e.g. "public/images/notion").
	// If empty, images are kept as remote URLs.
	ImageDir string
	// ImageURLPrefix is the URL prefix for downloaded images (e.g. "/images/notion").
	ImageURLPrefix string
}

func NewClient(token string) *Client {
	return &Client{
		token:      token,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// downloadImage downloads a remote image to ImageDir and returns the local path.
// Returns the original URL if ImageDir is not set or download fails.
func (c *Client) downloadImage(remoteURL string) string {
	if c.ImageDir == "" {
		return remoteURL
	}

	// Derive a stable filename from URL hash + original extension
	hash := sha256.Sum256([]byte(remoteURL))
	shortHash := hex.EncodeToString(hash[:8])
	ext := path.Ext(strings.SplitN(remoteURL, "?", 2)[0]) // strip query params
	if ext == "" || len(ext) > 6 {
		ext = ".png"
	}
	filename := shortHash + ext

	outPath := filepath.Join(c.ImageDir, filename)

	// Skip if already downloaded
	if _, err := os.Stat(outPath); err == nil {
		return c.ImageURLPrefix + "/" + filename
	}

	if err := os.MkdirAll(c.ImageDir, 0o755); err != nil {
		return remoteURL
	}

	resp, err := c.httpClient.Get(remoteURL)
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

	return c.ImageURLPrefix + "/" + filename
}

// Post represents a blog post fetched from Notion
type Post struct {
	ID          string
	Title       string
	Description string
	Date        time.Time
	Tags        []string
	Category    string
	Body        string // markdown
}

// ListDatabaseEntries fetches all pages from a Notion database
func (c *Client) ListDatabaseEntries(databaseID string) ([]Post, error) {
	var allPosts []Post
	var cursor *string

	for {
		body := map[string]interface{}{
			"page_size": 100,
		}
		if cursor != nil {
			body["start_cursor"] = *cursor
		}

		jsonBody, _ := json.Marshal(body)
		req, err := http.NewRequest("POST", apiBase+"/databases/"+databaseID+"/query", bytes.NewReader(jsonBody))
		if err != nil {
			return nil, err
		}
		c.setHeaders(req)

		resp, err := c.httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("notion API request failed: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			respBody, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("notion API error %d: %s", resp.StatusCode, string(respBody))
		}

		var result struct {
			Results    []json.RawMessage `json:"results"`
			HasMore    bool              `json:"has_more"`
			NextCursor *string           `json:"next_cursor"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}

		for _, raw := range result.Results {
			post, err := parsePageProperties(raw)
			if err != nil {
				continue // skip unparseable entries
			}
			allPosts = append(allPosts, post)
		}

		if !result.HasMore {
			break
		}
		cursor = result.NextCursor
	}

	return allPosts, nil
}

// FetchPageContent fetches all blocks of a page and converts to Markdown
func (c *Client) FetchPageContent(pageID string) (string, error) {
	var allBlocks []json.RawMessage
	var cursor *string

	for {
		url := apiBase + "/blocks/" + pageID + "/children?page_size=100"
		if cursor != nil {
			url += "&start_cursor=" + *cursor
		}

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return "", err
		}
		c.setHeaders(req)

		resp, err := c.httpClient.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			respBody, _ := io.ReadAll(resp.Body)
			return "", fmt.Errorf("notion blocks API error %d: %s", resp.StatusCode, string(respBody))
		}

		var result struct {
			Results    []json.RawMessage `json:"results"`
			HasMore    bool              `json:"has_more"`
			NextCursor *string           `json:"next_cursor"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return "", err
		}

		allBlocks = append(allBlocks, result.Results...)

		if !result.HasMore {
			break
		}
		cursor = result.NextCursor
	}

	return blocksToMarkdown(allBlocks, c), nil
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Notion-Version", apiVersion)
	req.Header.Set("Content-Type", "application/json")
}

// parsePageProperties extracts metadata from a Notion page object
func parsePageProperties(raw json.RawMessage) (Post, error) {
	var page struct {
		ID         string                            `json:"id"`
		Properties map[string]json.RawMessage        `json:"properties"`
		CreatedTime string                           `json:"created_time"`
	}
	if err := json.Unmarshal(raw, &page); err != nil {
		return Post{}, err
	}

	post := Post{ID: page.ID}

	// Parse created_time as fallback date
	if t, err := time.Parse(time.RFC3339, page.CreatedTime); err == nil {
		post.Date = t
	}

	for key, propRaw := range page.Properties {
		var prop struct {
			Type        string `json:"type"`
			Title       []struct {
				PlainText string `json:"plain_text"`
			} `json:"title"`
			RichText    []struct {
				PlainText string `json:"plain_text"`
			} `json:"rich_text"`
			Date        *struct {
				Start string `json:"start"`
			} `json:"date"`
			MultiSelect []struct {
				Name string `json:"name"`
			} `json:"multi_select"`
			Select      *struct {
				Name string `json:"name"`
			} `json:"select"`
		}
		if err := json.Unmarshal(propRaw, &prop); err != nil {
			continue
		}

		lowerKey := strings.ToLower(key)

		switch prop.Type {
		case "title":
			if len(prop.Title) > 0 {
				var parts []string
				for _, t := range prop.Title {
					parts = append(parts, t.PlainText)
				}
				post.Title = strings.Join(parts, "")
			}
		case "rich_text":
			if strings.Contains(lowerKey, "desc") || strings.Contains(lowerKey, "요약") || strings.Contains(lowerKey, "summary") {
				if len(prop.RichText) > 0 {
					var parts []string
					for _, t := range prop.RichText {
						parts = append(parts, t.PlainText)
					}
					post.Description = strings.Join(parts, "")
				}
			}
		case "date":
			if prop.Date != nil && prop.Date.Start != "" {
				if t, err := time.Parse("2006-01-02", prop.Date.Start); err == nil {
					post.Date = t
				} else if t, err := time.Parse(time.RFC3339, prop.Date.Start); err == nil {
					post.Date = t
				}
			}
		case "multi_select":
			if strings.Contains(lowerKey, "tag") {
				for _, tag := range prop.MultiSelect {
					post.Tags = append(post.Tags, tag.Name)
				}
			}
		case "select":
			if strings.Contains(lowerKey, "categ") || strings.Contains(lowerKey, "분류") {
				if prop.Select != nil {
					post.Category = prop.Select.Name
				}
			}
		}
	}

	if post.Title == "" {
		return Post{}, fmt.Errorf("no title found")
	}

	return post, nil
}

// blocksToMarkdown converts Notion blocks to Markdown
func blocksToMarkdown(blocks []json.RawMessage, client *Client) string {
	var sb strings.Builder
	prevType := ""
	listCounter := 0

	for _, raw := range blocks {
		var block struct {
			ID       string `json:"id"`
			Type     string `json:"type"`
			HasChildren bool `json:"has_children"`

			Paragraph       *richTextBlock `json:"paragraph"`
			Heading1        *richTextBlock `json:"heading_1"`
			Heading2        *richTextBlock `json:"heading_2"`
			Heading3        *richTextBlock `json:"heading_3"`
			BulletedListItem *richTextBlock `json:"bulleted_list_item"`
			NumberedListItem *richTextBlock `json:"numbered_list_item"`
			ToDo            *struct {
				RichText []richText `json:"rich_text"`
				Checked  bool       `json:"checked"`
			} `json:"to_do"`
			Toggle          *richTextBlock `json:"toggle"`
			Code            *struct {
				RichText []richText `json:"rich_text"`
				Language string     `json:"language"`
			} `json:"code"`
			Quote           *richTextBlock `json:"quote"`
			Callout         *struct {
				RichText []richText `json:"rich_text"`
				Icon     *struct {
					Emoji string `json:"emoji"`
				} `json:"icon"`
			} `json:"callout"`
			Image           *fileBlock `json:"image"`
			Divider         *struct{} `json:"divider"`
			Bookmark        *struct {
				URL string `json:"url"`
			} `json:"bookmark"`
			Equation        *struct {
				Expression string `json:"expression"`
			} `json:"equation"`
			ChildPage       *struct {
				Title string `json:"title"`
			} `json:"child_page"`
			Table           *struct {
				HasColumnHeader bool `json:"has_column_header"`
				HasRowHeader    bool `json:"has_row_header"`
				TableWidth      int  `json:"table_width"`
			} `json:"table"`
			TableRow        *struct {
				Cells [][]richText `json:"cells"`
			} `json:"table_row"`
			TableOfContents *struct{} `json:"table_of_contents"`
		}
		if err := json.Unmarshal(raw, &block); err != nil {
			continue
		}

		// Reset numbered list counter when type changes
		if block.Type != "numbered_list_item" && prevType == "numbered_list_item" {
			listCounter = 0
		}
		// Add blank line between different block types (except consecutive list items)
		if prevType != "" && prevType != block.Type {
			sb.WriteString("\n")
		}

		switch block.Type {
		case "paragraph":
			if block.Paragraph != nil {
				text := renderRichText(block.Paragraph.RichText)
				sb.WriteString(text + "\n")
			}
		case "heading_1":
			if block.Heading1 != nil {
				sb.WriteString("# " + renderRichText(block.Heading1.RichText) + "\n")
			}
		case "heading_2":
			if block.Heading2 != nil {
				sb.WriteString("## " + renderRichText(block.Heading2.RichText) + "\n")
			}
		case "heading_3":
			if block.Heading3 != nil {
				sb.WriteString("### " + renderRichText(block.Heading3.RichText) + "\n")
			}
		case "bulleted_list_item":
			if block.BulletedListItem != nil {
				sb.WriteString("- " + renderRichText(block.BulletedListItem.RichText) + "\n")
			}
		case "numbered_list_item":
			if block.NumberedListItem != nil {
				listCounter++
				sb.WriteString(fmt.Sprintf("%d. %s\n", listCounter, renderRichText(block.NumberedListItem.RichText)))
			}
		case "to_do":
			if block.ToDo != nil {
				check := " "
				if block.ToDo.Checked {
					check = "x"
				}
				sb.WriteString(fmt.Sprintf("- [%s] %s\n", check, renderRichText(block.ToDo.RichText)))
			}
		case "toggle":
			if block.Toggle != nil {
				sb.WriteString("<details>\n<summary>" + renderRichText(block.Toggle.RichText) + "</summary>\n\n")
				if block.HasChildren && client != nil {
					childMd, _ := client.FetchPageContent(block.ID)
					sb.WriteString(childMd)
				}
				sb.WriteString("</details>\n")
			}
		case "code":
			if block.Code != nil {
				lang := block.Code.Language
				if lang == "plain text" {
					lang = ""
				}
				sb.WriteString("```" + lang + "\n")
				sb.WriteString(renderRichText(block.Code.RichText) + "\n")
				sb.WriteString("```\n")
			}
		case "quote":
			if block.Quote != nil {
				lines := strings.Split(renderRichText(block.Quote.RichText), "\n")
				for _, line := range lines {
					sb.WriteString("> " + line + "\n")
				}
			}
		case "callout":
			if block.Callout != nil {
				emoji := ""
				if block.Callout.Icon != nil {
					emoji = block.Callout.Icon.Emoji + " "
				}
				sb.WriteString("> " + emoji + renderRichText(block.Callout.RichText) + "\n")
			}
		case "image":
			if block.Image != nil {
				imgURL := ""
				if block.Image.File != nil {
					imgURL = block.Image.File.URL
				} else if block.Image.External != nil {
					imgURL = block.Image.External.URL
				}
				caption := ""
				if len(block.Image.Caption) > 0 {
					caption = renderRichText(block.Image.Caption)
				}
				if imgURL != "" {
					// Download image locally if ImageDir is configured
					localURL := client.downloadImage(imgURL)
					sb.WriteString(fmt.Sprintf("![%s](%s)\n", caption, localURL))
				}
			}
		case "divider":
			sb.WriteString("---\n")
		case "bookmark":
			if block.Bookmark != nil {
				sb.WriteString(fmt.Sprintf("[%s](%s)\n", block.Bookmark.URL, block.Bookmark.URL))
			}
		case "equation":
			if block.Equation != nil {
				sb.WriteString("$$\n" + block.Equation.Expression + "\n$$\n")
			}
		case "child_page":
			// Recursively fetch child page content and inline it as a section
			if block.ChildPage != nil && client != nil {
				title := block.ChildPage.Title
				sb.WriteString("## " + title + "\n\n")
				childMd, err := client.FetchPageContent(block.ID)
				if err != nil {
					sb.WriteString(fmt.Sprintf("> ⚠️ Failed to load sub-page: %s\n\n", title))
				} else {
					sb.WriteString(childMd)
					sb.WriteString("\n")
				}
			}
		case "table":
			// Fetch table rows from children and render as markdown table
			if block.HasChildren && client != nil {
				tableRows := fetchTableRows(client, block.ID)
				if len(tableRows) > 0 {
					// First row
					sb.WriteString(renderMarkdownTableRow(tableRows[0]) + "\n")
					// Separator
					cols := len(tableRows[0])
					sep := "|"
					for i := 0; i < cols; i++ {
						sep += " --- |"
					}
					sb.WriteString(sep + "\n")
					// Remaining rows
					for _, row := range tableRows[1:] {
						sb.WriteString(renderMarkdownTableRow(row) + "\n")
					}
					sb.WriteString("\n")
				}
			}
		case "table_of_contents":
			// Skip — TOC is auto-generated by Astro
		}

		prevType = block.Type
	}

	return sb.String()
}

type richText struct {
	Type        string `json:"type"`
	PlainText   string `json:"plain_text"`
	Annotations struct {
		Bold          bool   `json:"bold"`
		Italic        bool   `json:"italic"`
		Strikethrough bool   `json:"strikethrough"`
		Underline     bool   `json:"underline"`
		Code          bool   `json:"code"`
	} `json:"annotations"`
	Href *string `json:"href"`
}

type richTextBlock struct {
	RichText []richText `json:"rich_text"`
}

type fileBlock struct {
	File     *struct{ URL string `json:"url"` }     `json:"file"`
	External *struct{ URL string `json:"url"` }     `json:"external"`
	Caption  []richText                               `json:"caption"`
}

// tableRow is one row of a Notion table, where each cell is []richText
type tableRow = [][]richText

// fetchTableRows fetches child table_row blocks and returns rows
func fetchTableRows(client *Client, tableBlockID string) []tableRow {
	childBlocks, err := fetchChildBlocks(client, tableBlockID)
	if err != nil {
		return nil
	}
	var rows []tableRow
	for _, raw := range childBlocks {
		var block struct {
			Type     string `json:"type"`
			TableRow *struct {
				Cells tableRow `json:"cells"`
			} `json:"table_row"`
		}
		if err := json.Unmarshal(raw, &block); err != nil || block.TableRow == nil {
			continue
		}
		rows = append(rows, block.TableRow.Cells)
	}
	return rows
}

func fetchChildBlocks(client *Client, blockID string) ([]json.RawMessage, error) {
	var all []json.RawMessage
	var cursor *string
	for {
		url := apiBase + "/blocks/" + blockID + "/children?page_size=100"
		if cursor != nil {
			url += "&start_cursor=" + *cursor
		}
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, err
		}
		client.setHeaders(req)
		resp, err := client.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		var result struct {
			Results    []json.RawMessage `json:"results"`
			HasMore    bool              `json:"has_more"`
			NextCursor *string           `json:"next_cursor"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}
		all = append(all, result.Results...)
		if !result.HasMore {
			break
		}
		cursor = result.NextCursor
	}
	return all, nil
}

func renderMarkdownTableRow(cells tableRow) string {
	var parts []string
	for _, cell := range cells {
		parts = append(parts, renderRichText(cell))
	}
	return "| " + strings.Join(parts, " | ") + " |"
}

func renderRichText(texts []richText) string {
	var sb strings.Builder
	for _, t := range texts {
		text := t.PlainText
		if t.Annotations.Code {
			text = "`" + text + "`"
		}
		if t.Annotations.Bold {
			text = "**" + text + "**"
		}
		if t.Annotations.Italic {
			text = "*" + text + "*"
		}
		if t.Annotations.Strikethrough {
			text = "~~" + text + "~~"
		}
		if t.Href != nil && *t.Href != "" {
			text = "[" + text + "](" + *t.Href + ")"
		}
		sb.WriteString(text)
	}
	return sb.String()
}

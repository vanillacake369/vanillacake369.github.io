package tui

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/vanillacake369/blog-importer/converter"
	"github.com/vanillacake369/blog-importer/notion"
	"github.com/vanillacake369/blog-importer/velog"
)

// ── Styles ──────────────────────────────────────────────────────────────────

var (
	titleStyle    = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("86")).MarginBottom(1)
	subtitleStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	selectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("86")).Bold(true)
	normalStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("252"))
	dimStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	errorStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("196")).Bold(true)
	successStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("82")).Bold(true)
	helpStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("241")).MarginTop(1)
	cursorStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("214")).Bold(true)
)

// ── Screens ─────────────────────────────────────────────────────────────────

type screen int

const (
	screenSource screen = iota
	screenLoading
	screenSelectPosts
	screenImporting
	screenDone
)

// ── Post item (unified for both sources) ────────────────────────────────────

type postItem struct {
	id       string
	title    string
	date     time.Time
	tags     []string
	source   string // "notion" or "velog"
	selected bool

	// source-specific data
	notionPost *notion.Post
	velogPost  *velog.Post
}

// ── Messages ────────────────────────────────────────────────────────────────

type postsLoadedMsg struct {
	posts []postItem
	err   error
}

type importDoneMsg struct {
	imported int
	errors   []string
}

// ── Model ───────────────────────────────────────────────────────────────────

type Model struct {
	screen       screen
	sourceIdx    int
	sources      []string
	posts        []postItem
	cursor       int
	scrollOffset int
	visibleRows  int
	statusMsg    string
	importResult *importDoneMsg
	Err          error
}

func NewModel() Model {
	return Model{
		screen:      screenSource,
		sources:     []string{"Notion", "Velog", "Both (Notion + Velog)"},
		visibleRows: 20,
	}
}

func (m Model) Init() tea.Cmd {
	return nil
}

// ── Update ──────────────────────────────────────────────────────────────────

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.visibleRows = msg.Height - 10
		if m.visibleRows < 5 {
			m.visibleRows = 5
		}
		return m, nil

	case tea.KeyMsg:
		switch m.screen {
		case screenSource:
			return m.updateSource(msg)
		case screenSelectPosts:
			return m.updateSelectPosts(msg)
		case screenDone:
			if msg.String() == "q" || msg.String() == "ctrl+c" || msg.String() == "enter" {
				return m, tea.Quit
			}
		}
		if msg.String() == "ctrl+c" || msg.String() == "q" {
			return m, tea.Quit
		}

	case postsLoadedMsg:
		if msg.err != nil {
			m.Err = msg.err
			m.statusMsg = errorStyle.Render("Error: " + msg.err.Error())
			m.screen = screenSource
			return m, nil
		}
		m.posts = msg.posts
		m.cursor = 0
		m.scrollOffset = 0
		m.screen = screenSelectPosts
		return m, nil

	case importDoneMsg:
		m.importResult = &msg
		m.screen = screenDone
		return m, nil
	}

	return m, nil
}

func (m Model) updateSource(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if m.sourceIdx > 0 {
			m.sourceIdx--
		}
	case "down", "j":
		if m.sourceIdx < len(m.sources)-1 {
			m.sourceIdx++
		}
	case "enter":
		m.screen = screenLoading
		m.statusMsg = "Fetching posts..."
		return m, m.loadPosts()
	case "q", "ctrl+c":
		return m, tea.Quit
	}
	return m, nil
}

func (m Model) updateSelectPosts(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if m.cursor > 0 {
			m.cursor--
			if m.cursor < m.scrollOffset {
				m.scrollOffset = m.cursor
			}
		}
	case "down", "j":
		if m.cursor < len(m.posts)-1 {
			m.cursor++
			if m.cursor >= m.scrollOffset+m.visibleRows {
				m.scrollOffset = m.cursor - m.visibleRows + 1
			}
		}
	case " ":
		if m.cursor < len(m.posts) {
			m.posts[m.cursor].selected = !m.posts[m.cursor].selected
		}
	case "a":
		allSelected := true
		for _, p := range m.posts {
			if !p.selected {
				allSelected = false
				break
			}
		}
		for i := range m.posts {
			m.posts[i].selected = !allSelected
		}
	case "enter":
		selectedCount := 0
		for _, p := range m.posts {
			if p.selected {
				selectedCount++
			}
		}
		if selectedCount == 0 {
			m.statusMsg = errorStyle.Render("No posts selected. Press SPACE to select.")
			return m, nil
		}
		m.screen = screenImporting
		m.statusMsg = fmt.Sprintf("Importing %d post(s)...", selectedCount)
		return m, m.importPosts()
	case "esc":
		m.screen = screenSource
		m.posts = nil
		return m, nil
	case "q", "ctrl+c":
		return m, tea.Quit
	}
	return m, nil
}

// ── View ────────────────────────────────────────────────────────────────────

func (m Model) View() string {
	var sb strings.Builder

	sb.WriteString(titleStyle.Render("📦 Blog Post Importer") + "\n")

	switch m.screen {
	case screenSource:
		sb.WriteString(subtitleStyle.Render("Select source to import from:") + "\n\n")
		for i, s := range m.sources {
			cursor := "  "
			style := normalStyle
			if i == m.sourceIdx {
				cursor = cursorStyle.Render("▸ ")
				style = selectedStyle
			}
			sb.WriteString(cursor + style.Render(s) + "\n")
		}
		if m.statusMsg != "" {
			sb.WriteString("\n" + m.statusMsg + "\n")
		}
		sb.WriteString(helpStyle.Render("\n↑↓/jk navigate • enter select • q quit"))

	case screenLoading:
		sb.WriteString("\n" + dimStyle.Render("⏳ "+m.statusMsg) + "\n")

	case screenSelectPosts:
		selectedCount := 0
		for _, p := range m.posts {
			if p.selected {
				selectedCount++
			}
		}
		sb.WriteString(subtitleStyle.Render(
			fmt.Sprintf("Found %d posts — %d selected", len(m.posts), selectedCount),
		) + "\n\n")

		end := m.scrollOffset + m.visibleRows
		if end > len(m.posts) {
			end = len(m.posts)
		}
		for i := m.scrollOffset; i < end; i++ {
			p := m.posts[i]
			cursor := "  "
			if i == m.cursor {
				cursor = cursorStyle.Render("▸ ")
			}

			check := dimStyle.Render("○")
			if p.selected {
				check = selectedStyle.Render("●")
			}

			dateStr := p.date.Format("2006-01-02")
			src := dimStyle.Render("[" + p.source + "]")

			title := normalStyle.Render(p.title)
			if i == m.cursor {
				title = selectedStyle.Render(p.title)
			}

			tags := ""
			if len(p.tags) > 0 {
				tags = dimStyle.Render(" #" + strings.Join(p.tags, " #"))
			}

			sb.WriteString(fmt.Sprintf("%s%s %s %s %s%s\n", cursor, check, dimStyle.Render(dateStr), src, title, tags))
		}

		if len(m.posts) > m.visibleRows {
			sb.WriteString(dimStyle.Render(fmt.Sprintf("\n  ... showing %d-%d of %d", m.scrollOffset+1, end, len(m.posts))))
		}

		if m.statusMsg != "" {
			sb.WriteString("\n" + m.statusMsg)
		}
		sb.WriteString(helpStyle.Render("\n↑↓/jk navigate • space toggle • a all • enter import • esc back • q quit"))

	case screenImporting:
		sb.WriteString("\n" + dimStyle.Render("⏳ "+m.statusMsg) + "\n")

	case screenDone:
		if m.importResult != nil {
			sb.WriteString("\n" + successStyle.Render(
				fmt.Sprintf("✓ Successfully imported %d post(s)", m.importResult.imported),
			) + "\n")
			if len(m.importResult.errors) > 0 {
				sb.WriteString(errorStyle.Render(
					fmt.Sprintf("\n✗ %d error(s):", len(m.importResult.errors)),
				) + "\n")
				for _, e := range m.importResult.errors {
					sb.WriteString("  " + dimStyle.Render("- "+e) + "\n")
				}
			}
			sb.WriteString(dimStyle.Render("\nOutput: src/content/posts/") + "\n")
		}
		sb.WriteString(helpStyle.Render("\nenter/q quit"))
	}

	return sb.String()
}

// ── Commands ────────────────────────────────────────────────────────────────

func (m Model) loadPosts() tea.Cmd {
	return func() tea.Msg {
		var posts []postItem

		loadNotion := m.sourceIdx == 0 || m.sourceIdx == 2
		loadVelog := m.sourceIdx == 1 || m.sourceIdx == 2

		if loadNotion {
			token := getEnv("notion_access_token", "NOTION_ACCESS_TOKEN")
			if token == "" {
				return postsLoadedMsg{err: fmt.Errorf("notion_access_token not set in .env")}
			}
			dbID := getEnv("notion_database_id", "NOTION_DATABASE_ID")
			if dbID == "" {
				dbID = "1e019c39029080f7acd0fbc44612cd39"
			}

			client := newNotionClient()
			notionPosts, err := client.ListDatabaseEntries(dbID)
			if err != nil {
				if strings.Contains(err.Error(), "object_not_found") {
					return postsLoadedMsg{err: fmt.Errorf(
						"notion: database not shared with integration.\n" +
							"  → Open Notion → Database page → ··· → Connections → Add your integration",
					)}
				}
				return postsLoadedMsg{err: fmt.Errorf("notion: %w", err)}
			}
			for i := range notionPosts {
				p := &notionPosts[i]
				posts = append(posts, postItem{
					id:         p.ID,
					title:      p.Title,
					date:       p.Date,
					tags:       p.Tags,
					source:     "notion",
					notionPost: p,
				})
			}
		}

		if loadVelog {
			accessToken := extractVelogAccessToken()
			client := velog.NewClient(accessToken)

			// Try authenticated currentUser, then fall back to env/default username
			username, _ := client.CurrentUser()
			if username == "" {
				username = getEnv("velog_username", "VELOG_USERNAME")
			}
			if username == "" {
				username = "vanillacake369" // default from project config
			}

			velogPosts, err := client.ListPosts(username)
			if err != nil {
				return postsLoadedMsg{err: fmt.Errorf("velog: %w", err)}
			}
			for i := range velogPosts {
				p := &velogPosts[i]
				posts = append(posts, postItem{
					id:        p.ID,
					title:     p.Title,
					date:      p.Date,
					tags:      p.Tags,
					source:    "velog",
					velogPost: p,
				})
			}
		}

		if len(posts) == 0 {
			return postsLoadedMsg{err: fmt.Errorf("no posts found")}
		}

		return postsLoadedMsg{posts: posts}
	}
}

func (m Model) importPosts() tea.Cmd {
	return func() tea.Msg {
		outDir := filepath.Join("..", "..", "src", "content", "posts")
		if err := os.MkdirAll(outDir, 0o755); err != nil {
			return importDoneMsg{errors: []string{"cannot create output dir: " + err.Error()}}
		}

		var imported int
		var errors []string

		for _, p := range m.posts {
			if !p.selected {
				continue
			}

			var pd converter.PostData
			pd.Title = p.title
			pd.Date = p.date
			pd.Tags = p.tags
			pd.Lang = "ko"
			pd.Draft = false

			switch p.source {
			case "notion":
				client := newNotionClient()
				body, err := client.FetchPageContent(p.id)
				if err != nil {
					errors = append(errors, fmt.Sprintf("[notion] %s: %v", p.title, err))
					continue
				}
				pd.Body = body
				pd.Description = p.notionPost.Description
				pd.Category = p.notionPost.Category
				pd.Source = "notion"

			case "velog":
				accessToken := extractVelogAccessToken()
				client := velog.NewClient(accessToken)

				username, _ := client.CurrentUser()
				if username == "" {
					username = getEnv("velog_username", "VELOG_USERNAME")
				}

				body, err := client.FetchPostBody(username, p.velogPost.URLSlug)
				if err != nil {
					errors = append(errors, fmt.Sprintf("[velog] %s: %v", p.title, err))
					continue
				}
				pd.Body = body
				pd.Description = p.velogPost.Description
				pd.Source = "velog"
			}

			filename := converter.SanitizeFilename(pd.Title) + ".md"
			outPath := filepath.Join(outDir, filename)

			content := pd.ToMarkdown()
			if err := os.WriteFile(outPath, []byte(content), 0o644); err != nil {
				errors = append(errors, fmt.Sprintf("write %s: %v", filename, err))
				continue
			}

			imported++
		}

		return importDoneMsg{imported: imported, errors: errors}
	}
}

// ── Helpers ─────────────────────────────────────────────────────────────────

func newNotionClient() *notion.Client {
	token := getEnv("notion_access_token", "NOTION_ACCESS_TOKEN")
	client := notion.NewClient(token)
	client.ImageDir = filepath.Join("..", "..", "public", "images", "notion")
	client.ImageURLPrefix = "/images/notion"
	return client
}

func getEnv(keys ...string) string {
	for _, key := range keys {
		if v := os.Getenv(key); v != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func extractVelogAccessToken() string {
	// Try direct env var first
	if v := getEnv("velog_access_token", "VELOG_ACCESS_TOKEN"); v != "" {
		return v
	}
	// Parse from cookie string (user's .env format)
	cookie := getEnv("velog_cookie", "VELOG_COOKIE")
	if cookie == "" {
		return ""
	}
	for _, part := range strings.Split(cookie, ";") {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "access_token=") {
			return strings.TrimPrefix(part, "access_token=")
		}
	}
	return ""
}

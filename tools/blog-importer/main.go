package main

import (
	"fmt"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/joho/godotenv"
	"github.com/vanillacake369/blog-importer/tui"
)

func main() {
	// Load .env from project root (two levels up from tools/blog-importer)
	rootEnv := filepath.Join("..", "..", ".env")
	_ = godotenv.Load(rootEnv)
	_ = godotenv.Load(".env") // also check local .env

	p := tea.NewProgram(tui.NewModel(), tea.WithAltScreen())
	m, err := p.Run()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	if finalModel, ok := m.(tui.Model); ok && finalModel.Err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", finalModel.Err)
		os.Exit(1)
	}
}

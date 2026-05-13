package velog

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const graphqlEndpoint = "https://v2.velog.io/graphql"

type Client struct {
	accessToken string
	httpClient  *http.Client
}

func NewClient(accessToken string) *Client {
	return &Client{
		accessToken: accessToken,
		httpClient:  &http.Client{Timeout: 30 * time.Second},
	}
}

// Post represents a blog post from Velog
type Post struct {
	ID          string
	Title       string
	Description string
	Date        time.Time
	UpdatedAt   time.Time
	Tags        []string
	Body        string
	URLSlug     string
	Thumbnail   string
}

// CurrentUser fetches the currently authenticated user's username
func (c *Client) CurrentUser() (string, error) {
	query := `query { currentUser { username } }`
	var result struct {
		Data struct {
			CurrentUser *struct {
				Username string `json:"username"`
			} `json:"currentUser"`
		} `json:"data"`
	}

	if err := c.doGraphQL(query, nil, &result); err != nil {
		// v2 API may not support currentUser — not a fatal error
		return "", err
	}
	if result.Data.CurrentUser == nil {
		return "", fmt.Errorf("not authenticated")
	}
	return result.Data.CurrentUser.Username, nil
}

// ListPosts fetches all posts for a given username
func (c *Client) ListPosts(username string) ([]Post, error) {
	var allPosts []Post
	var cursor *string

	for {
		query := `query Posts($username: String!, $cursor: ID) {
			posts(username: $username, cursor: $cursor) {
				id
				title
				short_description
				tags
				created_at
				updated_at
				url_slug
				thumbnail
			}
		}`

		vars := map[string]interface{}{
			"username": username,
		}
		if cursor != nil {
			vars["cursor"] = *cursor
		}

		var result struct {
			Data struct {
				Posts []struct {
					ID               string   `json:"id"`
					Title            string   `json:"title"`
					ShortDescription string   `json:"short_description"`
					Tags             []string `json:"tags"`
					CreatedAt        string   `json:"created_at"`
					UpdatedAt        string   `json:"updated_at"`
					URLSlug          string   `json:"url_slug"`
					Thumbnail        string   `json:"thumbnail"`
				} `json:"posts"`
			} `json:"data"`
			Errors []struct {
				Message string `json:"message"`
			} `json:"errors"`
		}

		if err := c.doGraphQL(query, vars, &result); err != nil {
			return nil, err
		}
		if len(result.Errors) > 0 {
			return nil, fmt.Errorf("velog API error: %s", result.Errors[0].Message)
		}

		if len(result.Data.Posts) == 0 {
			break
		}

		for _, p := range result.Data.Posts {
			post := Post{
				ID:          p.ID,
				Title:       p.Title,
				Description: p.ShortDescription,
				URLSlug:     p.URLSlug,
				Tags:        p.Tags,
				Thumbnail:   p.Thumbnail,
			}
			if t, err := time.Parse(time.RFC3339, p.CreatedAt); err == nil {
				post.Date = t
			}
			if t, err := time.Parse(time.RFC3339, p.UpdatedAt); err == nil {
				post.UpdatedAt = t
			}
			allPosts = append(allPosts, post)
		}

		lastID := result.Data.Posts[len(result.Data.Posts)-1].ID
		cursor = &lastID
	}

	return allPosts, nil
}

// FetchPostBody fetches the full markdown body for a single post
func (c *Client) FetchPostBody(username, urlSlug string) (string, error) {
	urlSlug = strings.TrimPrefix(urlSlug, "/")
	query := `query Post($username: String!, $url_slug: String!) {
		post(username: $username, url_slug: $url_slug) {
			body
		}
	}`

	vars := map[string]interface{}{
		"username": username,
		"url_slug": urlSlug,
	}

	var result struct {
		Data struct {
			Post *struct {
				Body string `json:"body"`
			} `json:"post"`
		} `json:"data"`
	}

	if err := c.doGraphQL(query, vars, &result); err != nil {
		return "", err
	}
	if result.Data.Post == nil {
		return "", fmt.Errorf("post not found: %s/%s", username, urlSlug)
	}
	return result.Data.Post.Body, nil
}

func (c *Client) doGraphQL(query string, variables map[string]interface{}, target interface{}) error {
	payload := map[string]interface{}{
		"query": query,
	}
	if variables != nil {
		payload["variables"] = variables
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", graphqlEndpoint, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.accessToken != "" {
		req.Header.Set("Cookie", "access_token="+c.accessToken)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("velog API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("velog API error %d: %s", resp.StatusCode, string(body))
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

package agents

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Debugger analyzes error logs and produces fixes.
type Debugger struct {
	apiKey string
	apiURL string
	model  string
	client *http.Client
}

func NewDebugger(apiKey, apiURL, model string) *Debugger {
	return &Debugger{
		apiKey: apiKey,
		apiURL: apiURL,
		model:  model,
		client: &http.Client{Timeout: 120 * time.Second},
	}
}

func (d *Debugger) Name() string {
	return "Debugger"
}

func (d *Debugger) Execute(ctx context.Context, prompt string) (string, error) {
	messages := []ChatMessage{
		{
			Role: "system",
			Content: `You are an expert debugger. Analyze the error log and source code provided.
Output a JSON object with exactly these fields:
{
  "analysis": "Brief description of the root cause",
  "fix_type": "code_patch" | "command" | "config_change",
  "fix_content": "The exact fix to apply (code diff, command to run, or config to change)"
}
Only output valid JSON. No additional text.`,
		},
		{
			Role:    "user",
			Content: prompt,
		},
	}

	return d.call(ctx, messages)
}

// ParseDebugResult parses the debugger's JSON output into a DebugResult.
func (d *Debugger) ParseDebugResult(output string) (*DebugResult, error) {
	var result DebugResult
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		return nil, fmt.Errorf("failed to parse debug result: %w\nraw output: %s", err, output)
	}
	return &result, nil
}

func (d *Debugger) call(ctx context.Context, messages []ChatMessage) (string, error) {
	reqBody := ChatRequest{
		Model:       d.model,
		Messages:    messages,
		Temperature: 0.0,
		MaxTokens:   2048,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, d.apiURL, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+d.apiKey)

	resp, err := d.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API call failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned %d: %s", resp.StatusCode, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no choices in API response")
	}

	return chatResp.Choices[0].Message.Content, nil
}

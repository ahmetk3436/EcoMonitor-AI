package agents

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

// Executioner runs Claude CLI commands for file creation and terminal operations.
type Executioner struct {
	timeout time.Duration
	workDir string
}

func NewExecutioner(workDir string) *Executioner {
	return &Executioner{
		timeout: 600 * time.Second,
		workDir: workDir,
	}
}

func (e *Executioner) Name() string {
	return "Executioner"
}

func (e *Executioner) Execute(ctx context.Context, prompt string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	// Use claude CLI in print mode with full tool access
	cmd := exec.CommandContext(ctx, "claude", "-p", "--dangerously-skip-permissions", prompt)
	cmd.Dir = e.workDir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	output := stdout.String()
	errOutput := stderr.String()

	if err != nil {
		return "", fmt.Errorf("claude CLI error: %w\nstdout: %s\nstderr: %s",
			err, output, errOutput)
	}

	if errOutput != "" {
		output += "\n--- stderr ---\n" + errOutput
	}

	return strings.TrimSpace(output), nil
}

// RunShellCommand executes an arbitrary shell command and returns its output.
func (e *Executioner) RunShellCommand(ctx context.Context, command string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, e.timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "sh", "-c", command)
	cmd.Dir = e.workDir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	output := stdout.String()

	if err != nil {
		return "", fmt.Errorf("command failed: %w\nstdout: %s\nstderr: %s",
			err, output, stderr.String())
	}

	return strings.TrimSpace(output), nil
}

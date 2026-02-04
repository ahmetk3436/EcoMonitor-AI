package loop

import (
	"context"
	"fmt"
	"log"

	"github.com/ahmetk3436/EcoMonitor-AI/orchestrator/internal/agents"
	"github.com/ahmetk3436/EcoMonitor-AI/orchestrator/internal/task"
)

// AgentSet holds all available agents.
type AgentSet struct {
	Engine      *agents.Engine
	Executioner *agents.Executioner
	Debugger    *agents.Debugger
}

// LoopConfig configures the autonomous loop.
type LoopConfig struct {
	MaxRetries  int
	TestCommand string
	ProjectDir  string
}

// RunAutonomousLoop executes the Plan → Execute → Test → Correct → Deploy loop.
func RunAutonomousLoop(ctx context.Context, t *task.Task, agentSet *AgentSet, cfg *LoopConfig) error {
	log.Printf("[LOOP] Starting task: %s", t.Title)

	// Phase 1: PLAN
	log.Println("[LOOP] Phase 1: Planning...")
	planPrompt := fmt.Sprintf(
		"Create a detailed implementation plan for the following task:\n\n"+
			"Title: %s\nDescription: %s\n\n"+
			"Output a step-by-step plan with file paths and code changes needed.",
		t.Title, t.Description,
	)

	plan, err := agentSet.Engine.Execute(ctx, planPrompt)
	if err != nil {
		return fmt.Errorf("planning failed: %w", err)
	}
	log.Printf("[LOOP] Plan generated (%d chars)", len(plan))

	// Phase 2: EXECUTE
	log.Println("[LOOP] Phase 2: Executing...")
	execPrompt := fmt.Sprintf(
		"Implement the following plan. Create or modify files as needed.\n\n"+
			"Plan:\n%s\n\n"+
			"Task: %s\nDescription: %s",
		plan, t.Title, t.Description,
	)

	execResult, err := agentSet.Executioner.Execute(ctx, execPrompt)
	if err != nil {
		return fmt.Errorf("execution failed: %w", err)
	}
	log.Printf("[LOOP] Execution complete (%d chars output)", len(execResult))

	// Phase 3-4: TEST → CORRECT (retry loop)
	for attempt := 1; attempt <= cfg.MaxRetries; attempt++ {
		log.Printf("[LOOP] Phase 3: Testing (attempt %d/%d)...", attempt, cfg.MaxRetries)

		testOutput, testErr := agentSet.Executioner.RunShellCommand(ctx, cfg.TestCommand)
		if testErr == nil {
			log.Println("[LOOP] Tests passed!")
			log.Printf("[LOOP] Test output: %s", testOutput)
			return nil // All tests pass — success!
		}

		log.Printf("[LOOP] Tests failed: %v", testErr)

		if attempt == cfg.MaxRetries {
			return fmt.Errorf("tests failed after %d retries: %w", cfg.MaxRetries, testErr)
		}

		// Phase 4: CORRECT
		log.Println("[LOOP] Phase 4: Debugging...")
		debugPrompt := fmt.Sprintf(
			"The following test command failed:\n\nCommand: %s\n\n"+
				"Error output:\n%s\n\n"+
				"Previous execution result:\n%s\n\n"+
				"Analyze the error and provide a fix.",
			cfg.TestCommand, testOutput, execResult,
		)

		fix, err := agentSet.Debugger.Execute(ctx, debugPrompt)
		if err != nil {
			log.Printf("[LOOP] Debugger error: %v", err)
			continue
		}

		log.Printf("[LOOP] Fix generated, applying...")

		// Apply fix via executioner
		fixPrompt := fmt.Sprintf(
			"Apply the following fix to the codebase:\n\n%s",
			fix,
		)

		execResult, err = agentSet.Executioner.Execute(ctx, fixPrompt)
		if err != nil {
			log.Printf("[LOOP] Fix application failed: %v", err)
			continue
		}
	}

	return fmt.Errorf("autonomous loop exhausted all retries")
}

// RunContinuous picks tasks from the task list and runs them through the loop.
func RunContinuous(ctx context.Context, taskMgr *task.Manager, agentSet *AgentSet, cfg *LoopConfig) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		t, err := taskMgr.NextPendingTask()
		if err != nil {
			log.Printf("[LOOP] No pending tasks: %v", err)
			return nil
		}

		log.Printf("[LOOP] Picked task: %s (%s)", t.Title, t.ID)

		if err := taskMgr.UpdateStatus(t.ID, "in_progress"); err != nil {
			log.Printf("[LOOP] Failed to update task status: %v", err)
		}

		if err := RunAutonomousLoop(ctx, t, agentSet, cfg); err != nil {
			log.Printf("[LOOP] Task failed: %v", err)
			if setErr := taskMgr.SetError(t.ID, err.Error()); setErr != nil {
				log.Printf("[LOOP] Failed to record error: %v", setErr)
			}
			continue
		}

		if err := taskMgr.UpdateStatus(t.ID, "completed"); err != nil {
			log.Printf("[LOOP] Failed to mark task as completed: %v", err)
		}

		log.Printf("[LOOP] Task completed: %s", t.Title)
	}
}

package config

import "os"

type Config struct {
	// Engine agent (DeepSeek-V3 / GLM-4)
	EngineAPIKey string
	EngineAPIURL string
	EngineModel  string

	// Debugger agent (DeepSeek)
	DebuggerAPIKey string
	DebuggerAPIURL string
	DebuggerModel  string

	// Project
	ProjectRoot string
	TaskFile    string

	// Limits
	MaxRetries     int
	TestCommandGo  string
	TestCommandWeb string
}

func Load() *Config {
	return &Config{
		EngineAPIKey: getEnv("ENGINE_API_KEY", ""),
		EngineAPIURL: getEnv("ENGINE_API_URL", "https://api.deepseek.com/v1/chat/completions"),
		EngineModel:  getEnv("ENGINE_MODEL", "deepseek-chat"),

		DebuggerAPIKey: getEnv("DEBUGGER_API_KEY", ""),
		DebuggerAPIURL: getEnv("DEBUGGER_API_URL", "https://api.deepseek.com/v1/chat/completions"),
		DebuggerModel:  getEnv("DEBUGGER_MODEL", "deepseek-chat"),

		ProjectRoot: getEnv("PROJECT_ROOT", ".."),
		TaskFile:    getEnv("TASK_FILE", "../task_list.json"),

		MaxRetries:     5,
		TestCommandGo:  "cd backend && go build ./...",
		TestCommandWeb: "cd mobile && npx tsc --noEmit",
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

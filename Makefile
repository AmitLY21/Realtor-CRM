# ==============================================================================
# Realtor-CRM — Development & Automation Makefile
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help install dev start build preview test test-ui lint screenshots clean

help: ## Display this help screen with all available commands
	@echo "Realtor-CRM — Available Make Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""

install: ## Install all project dependencies
	npm install

dev: ## Start the local Vite development server
	npm run dev

start: ## Alias for 'make dev'
	npm run dev

build: ## Compile TypeScript and build production PWA bundle in dist/
	npm run build

preview: ## Locally serve the production bundle for testing
	npm run preview

test: ## Run automated Playwright end-to-end test suite
	npx playwright test

test-ui: ## Run Playwright tests with interactive UI runner
	npx playwright test --ui

lint: ## Run linter checks across the codebase
	npx oxlint

screenshots: ## Capture high-resolution screenshots of app views
	node scripts/capture_screenshots.js

clean: ## Remove dist/, test reports, and temporary build caches
	rm -rf dist test-results playwright-report .playwright-mcp node_modules/.tmp
	@echo "Cleaned build artifacts and test caches."

package main

import (
	"log"
	"net/http"
	"os"

	"github.com/xhrobj-hex/ai-for-developers-project-386/backend/internal/httpapi"
	"github.com/xhrobj-hex/ai-for-developers-project-386/backend/internal/store"
)

func main() {
	port := portFromEnv()
	repo := store.NewMemoryStore()
	handler := httpapi.NewHandler(repo)

	server := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}

	log.Printf("backend listening on :%s", port)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func portFromEnv() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "8080"
	}

	return port
}

package main

import (
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
)

// Taglore writes release-notes/ before `docker build`; the files are compiled into the binary.
//
//go:embed release-notes
var notesFS embed.FS

type ReleaseNotes struct {
	Version  string `json:"version"`
	Title    string `json:"title"`
	Summary  string `json:"summary"`
	Announce bool   `json:"announce"`
}

func main() {
	sub, _ := fs.Sub(notesFS, "release-notes")

	// Serve the files as-is: GET /release-notes/latest.json
	http.Handle("/release-notes/", http.StripPrefix("/release-notes/", http.FileServer(http.FS(sub))))

	// Or decode them for your own endpoints or templates.
	var latest ReleaseNotes
	raw, err := fs.ReadFile(sub, "latest.json")
	if err == nil {
		_ = json.Unmarshal(raw, &latest)
	}
	http.HandleFunc("/api/version", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"version": latest.Version, "title": latest.Title})
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}

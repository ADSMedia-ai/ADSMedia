package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"

	"github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
)

const (
	apiBaseURL = "https://api.adsmedia.live/v1"
)

type Plugin struct {
	plugin.MattermostPlugin
	configurationLock sync.RWMutex
	configuration     *configuration
}

type configuration struct {
	ApiKey          string
	DefaultFromName string
}

func (p *Plugin) OnActivate() error {
	return p.API.RegisterCommand(&model.Command{
		Trigger:          "email",
		AutoComplete:     true,
		AutoCompleteDesc: "Send email via ADSMedia",
		AutoCompleteHint: "[to] [subject] [message]",
	})
}

func (p *Plugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	parts := strings.SplitN(args.Command, " ", 4)
	if len(parts) < 4 {
		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         "Usage: /email [to@example.com] [subject] [message]",
		}, nil
	}

	to := parts[1]
	subject := parts[2]
	message := parts[3]

	config := p.getConfiguration()
	if config.ApiKey == "" {
		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         "Error: ADSMedia API key not configured",
		}, nil
	}

	result, err := p.sendEmail(config, to, subject, message)
	if err != nil {
		return &model.CommandResponse{
			ResponseType: model.CommandResponseTypeEphemeral,
			Text:         fmt.Sprintf("Error: %s", err.Error()),
		}, nil
	}

	return &model.CommandResponse{
		ResponseType: model.CommandResponseTypeEphemeral,
		Text:         fmt.Sprintf("✅ Email sent to %s! Message ID: %s", to, result.MessageID),
	}, nil
}

type SendResult struct {
	Success bool `json:"success"`
	Data    struct {
		MessageID string `json:"message_id"`
	} `json:"data"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (p *Plugin) sendEmail(config *configuration, to, subject, message string) (*SendResult, error) {
	payload := map[string]interface{}{
		"to":        to,
		"subject":   subject,
		"html":      fmt.Sprintf("<p>%s</p>", message),
		"from_name": config.DefaultFromName,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", apiBaseURL+"/send", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+config.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result SendResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}

	if !result.Success {
		return nil, fmt.Errorf(result.Error.Message)
	}

	return &result, nil
}

func (p *Plugin) getConfiguration() *configuration {
	p.configurationLock.RLock()
	defer p.configurationLock.RUnlock()

	if p.configuration == nil {
		return &configuration{}
	}
	return p.configuration
}

func main() {
	plugin.ClientMain(&Plugin{})
}


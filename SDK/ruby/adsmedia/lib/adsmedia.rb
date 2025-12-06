require 'faraday'
require 'json'

module ADSMedia
  class Client
    BASE_URL = 'https://api.adsmedia.live/v1'.freeze

    def initialize(api_key)
      @api_key = api_key
      @conn = Faraday.new(url: BASE_URL) do |f|
        f.request :json
        f.response :json
        f.adapter Faraday.default_adapter
      end
    end

    # Test connection
    def ping
      get('/ping')
    end

    # Send single email
    def send_email(to:, subject:, html:, to_name: nil, from_name: nil, text: nil, reply_to: nil)
      payload = { to: to, subject: subject, html: html }
      payload[:to_name] = to_name if to_name
      payload[:from_name] = from_name if from_name
      payload[:text] = text if text
      payload[:reply_to] = reply_to if reply_to
      
      post('/send', payload)
    end

    # Send batch emails
    def send_batch(recipients:, subject:, html:, text: nil, preheader: nil, from_name: nil)
      payload = { recipients: recipients, subject: subject, html: html }
      payload[:text] = text if text
      payload[:preheader] = preheader if preheader
      payload[:from_name] = from_name if from_name
      
      post('/send/batch', payload)
    end

    # Check email status
    def get_status(message_id)
      get('/send/status', message_id: message_id)
    end

    # List campaigns
    def get_campaigns(limit: 50, offset: 0)
      get('/campaigns', limit: limit, offset: offset)
    end

    # Get campaign
    def get_campaign(id)
      get('/campaigns/get', id: id)
    end

    # Create campaign
    def create_campaign(name:, subject:, html:, text: nil, preheader: nil, type: 1)
      payload = { name: name, subject: subject, html: html, type: type }
      payload[:text] = text if text
      payload[:preheader] = preheader if preheader
      
      post('/campaigns/create', payload)
    end

    # List contact lists
    def get_lists
      get('/lists')
    end

    # Create list
    def create_list(name:, type: 1)
      post('/lists/create', name: name, type: type)
    end

    # Add contacts to list
    def add_contacts(list_id:, contacts:)
      post("/lists/contacts/add?id=#{list_id}", contacts: contacts)
    end

    # List schedules
    def get_schedules(status: 'queue')
      get('/schedules', status: status)
    end

    # Create schedule
    def create_schedule(campaign_id:, list_id:, server_id:, sender_name: nil, schedule: nil)
      payload = { campaign_id: campaign_id, list_id: list_id, server_id: server_id }
      payload[:sender_name] = sender_name if sender_name
      payload[:schedule] = schedule if schedule
      
      post('/schedules/create', payload)
    end

    # List servers
    def get_servers
      get('/servers')
    end

    # Verify domain
    def verify_domain(server_id)
      get('/domains/verify', server_id: server_id)
    end

    # Check suppression
    def check_suppression(email)
      get('/suppressions/check', email: email)
    end

    # Get account info
    def get_account
      get('/account')
    end

    # Get usage
    def get_usage
      get('/account/usage')
    end

    private

    def get(endpoint, params = {})
      response = @conn.get(endpoint) do |req|
        req.headers['Authorization'] = "Bearer #{@api_key}"
        req.params = params unless params.empty?
      end
      handle_response(response)
    end

    def post(endpoint, payload)
      response = @conn.post(endpoint) do |req|
        req.headers['Authorization'] = "Bearer #{@api_key}"
        req.body = payload
      end
      handle_response(response)
    end

    def handle_response(response)
      data = response.body
      raise ADSMediaError, data['error']['message'] || 'API Error' unless data['success']
      data['data']
    end
  end

  class ADSMediaError < StandardError; end
end


require 'sidekiq'
require './app.rb'
# Start up sidekiq via
# ./bin/sidekiq -r ./examples/leak.rb > /dev/null
class WebWorker
  include Sidekiq::Worker

  def perform(address)
    Website.create!(address: address)
    puts "The new website has been created"
  end
end
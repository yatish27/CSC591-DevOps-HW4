require 'bundler'
Bundler.require

require "sinatra/activerecord"
require './worker.rb'

class Website < ActiveRecord::Base
end

class App < Sinatra::Base
  @@redis = Redis.new
  register Sinatra::ActiveRecordExtension
  set :sessions, true

  get '/' do
    @websites = @@redis.lrange("websites:newest", 0, 4)
    @notice = @@redis.get('notice')
    @@redis.del('notice')
    erb :index
  end

  post '/website' do
    @@redis.lpush("websites:newest", params[:address])
    @@redis.ltrim("websites:newest", 0, 4)
    @@redis.set('notice', 'The website was successfully added in cache-queue. It will be added in database by backgroud worker')
    WebWorker.perform_async params[:address]
    redirect '/'
  end

  get '/list' do
    @websites = Website.all
    erb :list
  end
end

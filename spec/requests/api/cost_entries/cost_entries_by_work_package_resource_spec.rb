#-- copyright
# OpenProject is a project management system.
# Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See doc/COPYRIGHT.rdoc for more details.
#++

require 'spec_helper'
require 'rack/test'

describe 'API v3 Cost Entry resource' do
  include Rack::Test::Methods
  include API::V3::Utilities::PathHelper

  let(:current_user) {
    FactoryGirl.create(:user, member_in_project: project, member_through_role: role)
  }
  let(:role) { FactoryGirl.create(:role, permissions: total_permissions) }
  let(:total_permissions) {
    # always include view WP, to ensure accessibility
    [:view_work_packages] + cost_permissions
  }
  let(:cost_permissions) { [:view_cost_entries] }
  let(:project) { FactoryGirl.create(:project) }
  let(:work_package) { FactoryGirl.create(:work_package, project: project) }
  subject(:response) { last_response }

  let(:cost_entry) {
    FactoryGirl.build(:cost_entry,
                      project: project,
                      work_package: work_package,
                      user: current_user)
  }

  before do
    allow(User).to receive(:current).and_return current_user
    cost_entry.save!

    get get_path
  end

  describe 'work_packages/:id/cost_entries' do
    let(:get_path) { api_v3_paths.cost_entries_by_work_package work_package.id }

    context 'user can see any cost entries' do
      it 'should return HTTP 200' do
        expect(response.status).to eql(200)
      end
    end

    context 'user can see own cost entries' do
      let(:cost_permissions) { [:view_own_cost_entries] }
      it 'should return HTTP 200' do
        expect(response.status).to eql(200)
      end
    end

    context 'user has no cost entry permissions' do
      let(:cost_permissions) { [] }

      it_behaves_like 'error response',
                      403,
                      'MissingPermission',
                      I18n.t('api_v3.errors.code_403')
    end
  end

  describe 'work_packages/:id/summarized_costs_by_type' do
    let(:get_path) { api_v3_paths.summarized_work_package_costs_by_type work_package.id }

    context 'user can see any cost entries' do
      it 'should return HTTP 200' do
        expect(response.status).to eql(200)
      end
    end

    context 'user can see own cost entries' do
      let(:cost_permissions) { [:view_own_cost_entries] }
      it 'should return HTTP 200' do
        expect(response.status).to eql(200)
      end
    end

    context 'user has no cost entry permissions' do
      let(:cost_permissions) { [] }

      it_behaves_like 'error response',
                      403,
                      'MissingPermission',
                      I18n.t('api_v3.errors.code_403')
    end
  end
end

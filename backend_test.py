import requests
import sys
import json
from datetime import datetime

class AMARAAPITester:
    def __init__(self, base_url="https://jewel-workflow-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, description=""):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            result = {
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_data': None,
                'error': None
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    result['response_data'] = response.json()
                except:
                    result['response_data'] = response.text[:500] if response.text else None
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    result['error'] = error_detail
                    print(f"   Error: {error_detail}")
                except:
                    result['error'] = response.text[:500] if response.text else "No error details"
                    print(f"   Error: {result['error']}")

            self.test_results.append(result)
            return success, result['response_data'] or {}

        except requests.exceptions.RequestException as e:
            error_msg = f"Network error: {str(e)}"
            print(f"❌ Failed - {error_msg}")
            result = {
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': None,
                'success': False,
                'response_data': None,
                'error': error_msg
            }
            self.test_results.append(result)
            return False, {}
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            print(f"❌ Failed - {error_msg}")
            result = {
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': None,
                'success': False,
                'response_data': None,
                'error': error_msg
            }
            self.test_results.append(result)
            return False, {}

    def test_health_endpoints(self):
        """Test basic health and connectivity"""
        print("\n" + "="*50)
        print("TESTING HEALTH & CONNECTIVITY")
        print("="*50)
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200, description="Check if API is accessible")
        
        # Test health endpoint
        success, response = self.run_test("Health Check", "GET", "health", 200, 
                                        description="Verify database connectivity")
        if success:
            print(f"   Database status: {response.get('database', 'unknown')}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        success, response = self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200,
                                        description="Check dashboard overview statistics")
        if success:
            expected_stats = {
                'total_products': 2,
                'total_users': 6,
                'total_dices': 6
            }
            print(f"   📊 Stats Retrieved:")
            for key, value in response.items():
                expected = expected_stats.get(key)
                status = "✅" if expected and value == expected else "ℹ️"
                print(f"   {status} {key}: {value}" + (f" (expected: {expected})" if expected else ""))

    def test_lookup_tables(self):
        """Test all 7 SKU lookup tables"""
        print("\n" + "="*50)
        print("TESTING SKU LOOKUP TABLES")
        print("="*50)
        
        lookup_tables = ['face_value', 'category', 'material', 'motif', 'finding', 'locking', 'size']
        
        for table in lookup_tables:
            success, response = self.run_test(f"Get {table.title()} Lookup", "GET", f"lookups/{table}", 200,
                                            description=f"Retrieve all {table} lookup entries")
            if success:
                print(f"   📋 Found {len(response)} {table} entries")
                if response:
                    # Show first few entries
                    for i, item in enumerate(response[:3]):
                        print(f"      [{item.get('code', '?')}] {item.get('name', 'Unknown')}")
                    if len(response) > 3:
                        print(f"      ... and {len(response) - 3} more")

    def test_products(self):
        """Test products endpoints including new CRUD and search features"""
        print("\n" + "="*50)
        print("TESTING PRODUCTS (CRUD + SEARCH + PAGINATION)")
        print("="*50)
        
        # Test paginated products endpoint
        success, response = self.run_test("Get Products (Paginated)", "GET", "products", 200,
                                        description="Retrieve products with new paginated structure")
        if success:
            # Check new paginated structure
            required_keys = ['items', 'total', 'page', 'page_size', 'total_pages']
            missing_keys = [key for key in required_keys if key not in response]
            if missing_keys:
                print(f"   ❌ Missing pagination keys: {missing_keys}")
            else:
                print(f"   ✅ Paginated structure confirmed")
                print(f"   📦 Found {response['total']} total products, page {response['page']}/{response['total_pages']}")
                
                items = response.get('items', [])
                for product in items:
                    print(f"      [{product.get('sku', 'No SKU')}] {product.get('name', 'Unnamed')}")
        
        # Test pagination with specific page size
        success, response = self.run_test("Products Pagination", "GET", "products?page=1&page_size=5", 200,
                                        description="Test pagination with page_size=5")
        if success:
            items = response.get('items', [])
            page_size = response.get('page_size', 0)
            print(f"   📄 Page size: {page_size}, Items returned: {len(items)}")
        
        # Test product search by name
        success, response = self.run_test("Product Search by Name", "GET", "products?q=bugadi", 200,
                                        description="Search products by 'bugadi' keyword")
        if success:
            items = response.get('items', [])
            print(f"   🔍 Search 'bugadi' returned {len(items)} products")
            for product in items:
                name = product.get('name', '').lower()
                sku = product.get('sku', '').lower()
                if 'bugadi' in name or 'bugadi' in sku:
                    print(f"   ✅ Match found: [{product.get('sku')}] {product.get('name')}")
        
        # Test product CRUD operations if we have products
        if success and items:
            product_id = items[0]['id']
            original_name = items[0]['name']
            
            # Test UPDATE product
            update_data = {
                "name": "Updated Test Product",
                "description": "Updated description for testing"
            }
            success, updated_product = self.run_test("Update Product", "PUT", f"products/{product_id}", 200,
                                                   data=update_data,
                                                   description="Test product name/description update")
            if success:
                print(f"   ✏️ Updated product: {updated_product.get('name')}")
                
                # Restore original name
                restore_data = {"name": original_name}
                self.run_test("Restore Product Name", "PUT", f"products/{product_id}", 200,
                             data=restore_data, description="Restore original product name")
            
            # Test soft DELETE product  
            success, delete_result = self.run_test("Soft Delete Product", "DELETE", f"products/{product_id}", 200,
                                                 description="Test soft delete (sets is_active=false)")
            if success:
                print(f"   🗑️ Soft delete mode: {delete_result.get('mode', 'unknown')}")
                
                # Restore active status
                restore_data = {"is_active": True}
                self.run_test("Restore Product Active", "PUT", f"products/{product_id}", 200,
                             data=restore_data, description="Restore product active status")

    def test_users(self):
        """Test users endpoint"""
        print("\n" + "="*50)
        print("TESTING USERS")
        print("="*50)
        
        success, response = self.run_test("Get Users", "GET", "users", 200,
                                        description="Retrieve all system users")
        if success:
            print(f"   👥 Found {len(response)} users")
            roles = {}
            for user in response:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
            
            for role, count in roles.items():
                print(f"      {role}: {count} users")

    def test_dices_and_manufacturing(self):
        """Test dices and manufacturing endpoints"""
        print("\n" + "="*50)
        print("TESTING MANUFACTURING & DICES")
        print("="*50)
        
        # Test dices
        success, response = self.run_test("Get Dices", "GET", "dices", 200,
                                        description="Retrieve all manufacturing dices")
        if success:
            print(f"   🎲 Found {len(response)} dices")
            for dice in response[:5]:  # Show first 5
                print(f"      {dice.get('dice_number', 'N/A')} ({dice.get('dice_type', 'unknown')})")
        
        # Test motif mappings
        success, response = self.run_test("Get Motif Mappings", "GET", "dice-mappings/motif", 200,
                                        description="Retrieve dice-motif mappings")
        if success:
            print(f"   🔗 Found {len(response)} motif mappings")
        
        # Test locking mappings
        success, response = self.run_test("Get Locking Mappings", "GET", "dice-mappings/locking", 200,
                                        description="Retrieve dice-locking mappings")
        if success:
            print(f"   🔒 Found {len(response)} locking mappings")

    def test_production_workflows(self):
        """Test job cards and QC logs"""
        print("\n" + "="*50)
        print("TESTING PRODUCTION WORKFLOWS")
        print("="*50)
        
        # Test job cards
        success, response = self.run_test("Get Job Cards", "GET", "job-cards", 200,
                                        description="Retrieve all job cards")
        if success:
            print(f"   📋 Found {len(response)} job cards")
            if response:
                statuses = {}
                for jc in response:
                    status = jc.get('status', 'unknown')
                    statuses[status] = statuses.get(status, 0) + 1
                
                for status, count in statuses.items():
                    print(f"      {status}: {count} job cards")
        
        # Test QC logs
        success, response = self.run_test("Get QC Logs", "GET", "qc-logs", 200,
                                        description="Retrieve all QC inspection logs")
        if success:
            print(f"   ✅ Found {len(response)} QC logs")

    def test_inventory(self):
        """Test inventory endpoints"""
        print("\n" + "="*50)
        print("TESTING INVENTORY")
        print("="*50)
        
        success, response = self.run_test("Get Inventory", "GET", "inventory", 200,
                                        description="Retrieve all inventory entries")
        if success:
            print(f"   🏭 Found {len(response)} inventory entries")
            total_value = sum(
                (item.get('stock_qty', 0) * (item.get('selling_price') or 0))
                for item in response
            )
            print(f"   💰 Total inventory value: ${total_value:,.2f}")

    def test_production_details(self):
        """Test production details endpoints"""
        print("\n" + "="*50)
        print("TESTING PRODUCTION DETAILS")
        print("="*50)
        
        success, response = self.run_test("Get Production", "GET", "production", 200,
                                        description="Retrieve production details with material assignments")
        if success:
            print(f"   ⚙️ Found {len(response)} production entries")

    def test_migrations(self):
        """Test migrations viewer"""
        print("\n" + "="*50)
        print("TESTING MIGRATIONS VIEWER")
        print("="*50)
        
        success, response = self.run_test("Get Migrations", "GET", "migrations", 200,
                                        description="Retrieve SQL migration files")
        if success:
            print(f"   📄 Found {len(response)} migration files")
            expected_count = 9
            if len(response) == expected_count:
                print(f"   ✅ Expected {expected_count} migration files found")
            else:
                print(f"   ⚠️ Expected {expected_count}, found {len(response)} migration files")
            
            # Show first few migration files
            for i, migration in enumerate(response[:5]):
                filename = migration.get('filename', f'Unknown-{i}')
                content_length = len(migration.get('content', ''))
                print(f"      {filename} ({content_length} chars)")

    def test_sku_generator(self):
        """Test SKU generation preview"""
        print("\n" + "="*50)
        print("TESTING SKU GENERATOR")
        print("="*50)
        
        # First get sample lookup IDs for each category
        lookup_tables = ['face_value', 'category', 'material', 'motif', 'finding', 'locking', 'size']
        sample_ids = {}
        
        print("   🔍 Getting sample lookup IDs...")
        for table in lookup_tables:
            success, response = self.run_test(f"Sample {table}", "GET", f"lookups/{table}", 200,
                                            description=f"Get sample {table} for SKU preview")
            if success and response:
                sample_ids[f"{table}_id"] = response[0]['id']
                print(f"      {table}: {response[0]['code']} - {response[0]['name']}")
        
        if len(sample_ids) == 7:
            # Test SKU preview with all attributes
            preview_data = {
                "name": "Test Product for SKU Preview",
                **sample_ids
            }
            
            success, response = self.run_test("SKU Preview Generation", "POST", "sku/preview", 200,
                                            data=preview_data,
                                            description="Generate SKU preview with all 7 attributes")
            if success:
                print(f"   🎯 Generated SKU Preview:")
                print(f"      Prefix: {response.get('prefix', 'N/A')}")
                print(f"      Suffix: {response.get('suffix', 'N/A')}")
                print(f"      Full SKU: {response.get('full_sku', 'N/A')}")
                print(f"      Next Sequence: {response.get('next_sequence', 'N/A')}")
        else:
            print(f"   ❌ Could not get sample IDs from all lookup tables (got {len(sample_ids)}/7)")

    def test_schema_info(self):
        """Test schema information endpoint"""
        print("\n" + "="*50)
        print("TESTING SCHEMA INFORMATION")
        print("="*50)
        
        success, response = self.run_test("Get Schema", "GET", "schema", 200,
                                        description="Retrieve database schema information")
        if success:
            print(f"   🗃️ Found schema for {len(response)} tables")
            # Show some important tables
            important_tables = ['products', 'sku_face_value', 'sku_category', 'dices', 'job_cards']
            for table in important_tables:
                if table in response:
                    print(f"      {table}: {len(response[table])} columns")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        
        print(f"📊 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Show failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                error_msg = test['error'] or f"Status {test['actual_status']}"
                print(f"   • {test['name']} - {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    """Run all AMARA API tests"""
    print("🚀 AMARA ERP/MIS API Testing Suite")
    print("="*70)
    
    tester = AMARAAPITester()
    
    try:
        # Run all test suites
        tester.test_health_endpoints()
        tester.test_dashboard_stats()
        tester.test_lookup_tables()
        tester.test_products()
        tester.test_users()
        tester.test_dices_and_manufacturing()
        tester.test_production_workflows()
        tester.test_inventory()
        tester.test_production_details()
        tester.test_migrations()
        tester.test_sku_generator()
        tester.test_schema_info()
        
        # Print summary
        all_passed = tester.print_summary()
        
        # Save detailed results
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_tests': tester.tests_run,
                    'passed': tester.tests_passed,
                    'failed': tester.tests_run - tester.tests_passed,
                    'success_rate': tester.tests_passed / tester.tests_run * 100
                },
                'detailed_results': tester.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
        
        return 0 if all_passed else 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 2
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        return 3

if __name__ == "__main__":
    sys.exit(main())
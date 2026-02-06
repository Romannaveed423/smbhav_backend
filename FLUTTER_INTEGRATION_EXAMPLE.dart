// ignore_for_file: undefined_class, undefined_method, undefined_getter, undefined_setter, undefined_identifier, invalid_override, invalid_annotation_target, type_argument_not_matching_bounds
// ============================================
// Flutter Integration Example - Click Tracking
// ============================================
// NOTE: This is an example/reference file. It contains code snippets meant to be
// copied to separate files in a Flutter project. The linter errors are expected
// since Flutter packages are not available in the backend directory.
// 
// Copy these files to your Flutter project
// 
// Files to create:
// 1. lib/services/earnings_api.dart
// 2. lib/models/click_response.dart
// 3. lib/screens/task_webview_screen.dart
// 4. lib/widgets/task_button.dart
//
// Usage example at the bottom
// ============================================

// ============================================
// 1. lib/services/earnings_api.dart
// ============================================
// Note: In actual Flutter project, uncomment these imports:
// import 'package:http/http.dart' as http;
// import 'dart:convert';
// import '../models/click_response.dart';

class EarningsApi {
  final String baseUrl;
  final String? token;
  
  EarningsApi({
    this.baseUrl = 'https://yourapp.com/api/v1',
    this.token,
  });
  
  /// Generate click and get tracking URL
  /// Returns ClickResponse with clickId, redirectUrl, etc.
  Future<ClickResponse> generateClick({
    required String productId,
    required String taskUrl,
    String? offerId,
  }) async {
    final url = Uri.parse('$baseUrl/earn/products/$productId/click');
    
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'taskUrl': taskUrl,
        if (offerId != null) 'offerId': offerId,
      }),
    );
    
    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return ClickResponse.fromJson(data['data']);
      } else {
        throw Exception(data['message'] ?? 'Failed to generate click');
      }
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to generate click');
    }
  }
  
  /// Track click for analytics (optional)
  Future<void> trackClick(String clickId) async {
    try {
      final url = Uri.parse('$baseUrl/earn/track/$clickId');
      await http.get(url);
      // Ignore response - this is just for analytics
    } catch (e) {
      // Silently fail - analytics should not break the flow
      print('Analytics tracking failed: $e');
    }
  }
}

// ============================================
// 2. lib/models/click_response.dart
// ============================================
class ClickResponse {
  final String clickId;
  final String redirectUrl;
  final DateTime expiresAt;
  final String trackingUrl;
  
  ClickResponse({
    required this.clickId,
    required this.redirectUrl,
    required this.expiresAt,
    required this.trackingUrl,
  });
  
  factory ClickResponse.fromJson(Map<String, dynamic> json) {
    return ClickResponse(
      clickId: json['clickId'] as String,
      redirectUrl: json['redirectUrl'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      trackingUrl: json['trackingUrl'] as String,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'clickId': clickId,
      'redirectUrl': redirectUrl,
      'expiresAt': expiresAt.toIso8601String(),
      'trackingUrl': trackingUrl,
    };
  }
  
  /// Check if click has expired
  bool get isExpired => DateTime.now().isAfter(expiresAt);
}

// ============================================
// 3. lib/screens/task_webview_screen.dart
// ============================================
// Note: In actual Flutter project, uncomment these imports:
// import 'package:flutter/material.dart';
// import 'package:webview_flutter/webview_flutter.dart';

class TaskWebViewScreen extends StatefulWidget {
  final String redirectUrl;
  final String clickId;
  
  const TaskWebViewScreen({
    Key? key,
    required this.redirectUrl,
    required this.clickId,
  }) : super(key: key);
  
  @override
  State<TaskWebViewScreen> createState() => _TaskWebViewScreenState();
}

class _TaskWebViewScreenState extends State<TaskWebViewScreen> {
  late WebViewController controller;
  bool isLoading = true;
  String? error;
  
  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }
  
  void _initializeWebView() {
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              isLoading = true;
              error = null;
            });
          },
          onPageFinished: (String url) {
            setState(() => isLoading = false);
          },
          onWebResourceError: (WebResourceError webResourceError) {
            setState(() {
              isLoading = false;
              error = webResourceError.description;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            // Allow all navigation
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.redirectUrl));
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Complete Task'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              setState(() => isLoading = true);
              controller.reload();
            },
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
            tooltip: 'Close',
          ),
        ],
      ),
      body: Stack(
        children: [
          if (error == null)
            WebViewWidget(controller: controller)
          else
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text(
                    'Error loading page',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(error ?? 'Unknown error'),
                  SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      setState(() => error = null);
                      _initializeWebView();
                    },
                    child: Text('Retry'),
                  ),
                ],
              ),
            ),
          if (isLoading && error == null)
            Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}

// ============================================
// 4. lib/widgets/task_button.dart
// ============================================
// Note: In actual Flutter project, uncomment these imports:
// import 'package:flutter/material.dart';
// import '../services/earnings_api.dart';
// import '../models/click_response.dart';
// import '../screens/task_webview_screen.dart';

class TaskButton extends StatefulWidget {
  final String productId;
  final String taskUrl;
  final String? offerId;
  final String? token;
  final Widget? child;
  final VoidCallback? onSuccess;
  final Function(String)? onError;
  
  const TaskButton({
    Key? key,
    required this.productId,
    required this.taskUrl,
    this.offerId,
    this.token,
    this.child,
    this.onSuccess,
    this.onError,
  }) : super(key: key);
  
  @override
  State<TaskButton> createState() => _TaskButtonState();
}

class _TaskButtonState extends State<TaskButton> {
  bool isLoading = false;
  
  Future<void> _startTask() async {
    // Check if user is authenticated
    if (widget.token == null || widget.token!.isEmpty) {
      _showError('Please login to continue');
      return;
    }
    
    // Validate taskUrl
    if (widget.taskUrl.isEmpty || !Uri.tryParse(widget.taskUrl)!.hasScheme) {
      _showError('Invalid task URL');
      return;
    }
    
    setState(() => isLoading = true);
    
    try {
      final api = EarningsApi(token: widget.token);
      
      // Generate click and get tracking URL
      final clickResponse = await api.generateClick(
        productId: widget.productId,
        taskUrl: widget.taskUrl,
        offerId: widget.offerId,
      );
      
      // Check if click has expired (shouldn't happen but good to check)
      if (clickResponse.isExpired) {
        _showError('This task has expired. Please try again.');
        return;
      }
      
      // Optional: Track click for analytics
      await api.trackClick(clickResponse.clickId);
      
      // Navigate to WebView with tracking URL
      if (mounted) {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TaskWebViewScreen(
              redirectUrl: clickResponse.redirectUrl,
              clickId: clickResponse.clickId,
            ),
          ),
        );
        
        // Call success callback if provided
        if (widget.onSuccess != null) {
          widget.onSuccess!();
        }
      }
    } catch (e) {
      final errorMessage = e.toString().replaceAll('Exception: ', '');
      _showError(errorMessage);
      
      if (widget.onError != null) {
        widget.onError!(errorMessage);
      }
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }
  
  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : _startTask,
      style: ElevatedButton.styleFrom(
        minimumSize: Size(double.infinity, 48),
      ),
      child: isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : widget.child ?? Text('Start Task'),
    );
  }
}

// ============================================
// USAGE EXAMPLE
// ============================================
/*
// Example 1: Simple usage in a product card
class ProductCard extends StatelessWidget {
  final Product product;
  final String? userToken;
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(product.name),
          Text('Earn up to ₹${product.earnUpTo}'),
          
          // Simple button
          TaskButton(
            productId: product.id,
            taskUrl: product.taskUrl, // From your product model
            token: userToken,
          ),
        ],
      ),
    );
  }
}

// Example 2: In an offer detail screen
class OfferDetailScreen extends StatelessWidget {
  final Offer offer;
  final String? userToken;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(offer.name)),
      body: Column(
        children: [
          Text('Amount: ₹${offer.amount}'),
          Text(offer.description),
          
          SizedBox(height: 24),
          
          // Custom button with callbacks
          TaskButton(
            productId: offer.productId,
            taskUrl: offer.taskUrl,
            offerId: offer.id,
            token: userToken,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.play_arrow),
                SizedBox(width: 8),
                Text('Start Earning'),
              ],
            ),
            onSuccess: () {
              // Task started successfully
              print('Task started');
              // Maybe refresh earnings or show a message
            },
            onError: (error) {
              // Handle error (already shown in SnackBar, but you can log it)
              print('Error starting task: $error');
            },
          ),
        ],
      ),
    );
  }
}

// Example 3: Check click status before showing button
class SmartTaskButton extends StatelessWidget {
  final String productId;
  final String taskUrl;
  final String? token;
  
  @override
  Widget build(BuildContext context) {
    // You might want to check if user has already completed this task
    // or check click expiration, etc.
    
    return TaskButton(
      productId: productId,
      taskUrl: taskUrl,
      token: token,
      onSuccess: () {
        // Refresh your earnings list or dashboard
        // Maybe navigate to earnings screen
      },
    );
  }
}

// Example 4: Using with StreamBuilder for real-time updates
class TaskButtonWithStatus extends StatelessWidget {
  final String productId;
  final String taskUrl;
  final String? token;
  
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<ClickResponse?>(
      // Your stream that listens for click status updates
      stream: null, // Implement your own stream
      builder: (context, snapshot) {
        if (snapshot.hasData && snapshot.data != null) {
          // Show status if click was generated
          return Column(
            children: [
              Text('Click ID: ${snapshot.data!.clickId}'),
              TaskButton(
                productId: productId,
                taskUrl: taskUrl,
                token: token,
              ),
            ],
          );
        }
        
        return TaskButton(
          productId: productId,
          taskUrl: taskUrl,
          token: token,
        );
      },
    );
  }
}
*/

// ============================================
// ADD TO pubspec.yaml
// ============================================
/*
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  url_launcher: ^6.2.1
  webview_flutter: ^4.4.0
*/

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================
/*
// lib/config/api_config.dart
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://yourapp.com/api/v1',
  );
  
  // Or use different URLs for dev/prod
  // static const String baseUrl = kDebugMode 
  //   ? 'http://localhost:3000/api/v1'
  //   : 'https://yourapp.com/api/v1';
}

// Then update EarningsApi:
class EarningsApi {
  final String baseUrl;
  
  EarningsApi({
    String? baseUrl,
    this.token,
  }) : baseUrl = baseUrl ?? ApiConfig.baseUrl;
}
*/


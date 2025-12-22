<?php

namespace App\Http\Controllers;

use App\Blog;
use App\Brand;
use App\Cart;
use App\Category;
use App\Counter;
use App\FAQ;
use App\Gallery;
use App\Order;
use App\OrderedProducts;
use App\PageSettings;
use App\Product;
use App\Review;
use App\SectionTitles;
use App\Service;
use App\ServiceSection;
use App\Settings;
use App\SiteLanguage;
use App\Subscribers;
use App\Testimonial;
use App\UserProfile;
use App\Vendors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Input;

class FrontEndController extends Controller
{

    public function __construct()
    {
        //$this->middleware('web');
        //$this->middleware('auth:profile');
        //$referral_url = "";
        if(isset($_SERVER['HTTP_REFERER'])){
            $referral = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST);
            if ($referral != $_SERVER['SERVER_NAME']){

                $brwsr = Counter::where('type','browser')->where('referral',$this->getOS());
                if($brwsr->count() > 0){
                    $brwsr = $brwsr->first();
                    $tbrwsr['total_count']= $brwsr->total_count + 1;
                    $brwsr->update($tbrwsr);
                }else{
                    $newbrws = new Counter();
                    $newbrws['referral']= $this->getOS();
                    $newbrws['type']= "browser";
                    $newbrws['total_count']= 1;
                    $newbrws->save();
                }

                $count = Counter::where('referral',$referral);
                if($count->count() > 0){
                    $counts = $count->first();
                    $tcount['total_count']= $counts->total_count + 1;
                    $counts->update($tcount);
                }else{
                    $newcount = new Counter();
                    $newcount['referral']= $referral;
                    $newcount['total_count']= 1;
                    $newcount->save();
                }
            }
        }else{
            $brwsr = Counter::where('type','browser')->where('referral',$this->getOS());
            if($brwsr->count() > 0){
                $brwsr = $brwsr->first();
                $tbrwsr['total_count']= $brwsr->total_count + 1;
                $brwsr->update($tbrwsr);
            }else{
                $newbrws = new Counter();
                $newbrws['referral']= $this->getOS();
                $newbrws['type']= "browser";
                $newbrws['total_count']= 1;
                $newbrws->save();
            }
        }
    }

    function getOS() {

        
        return "web";
    }

    public function failures()
    {
        return view('failures');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $categories = Category::where('role', 'sub')->get();
        $newproducts = Product::orderBy('id','desc')->take(10)->get();
        $newkenteproducts = Product::where('subcategory', Category::where('name', 'kentes')->first()->id)->orderBy('id','desc')->take(10)->get();
        $newcoutureproducts = Product::where('category', Category::where('name', 'coutures')->first()->id)->orderBy('id','desc')->take(10)->get();
        $newaccessoireproducts = Product::where('category', Category::where('name', 'accessoires')->first()->id)->orderBy('id','desc')->take(10)->get();
        $mostviewedproducts = Product::orderBy('views','desc')->take(5)->get();
        $mostviewedproduct = Product::orderBy('views','desc')->first();
        $discountproducts = Product::orderBy('id','asc')->take(10)->get();
        return view('index', compact('categories', 'newproducts', 'newkenteproducts', 'newcoutureproducts', 'newaccessoireproducts', 'mostviewedproduct','mostviewedproducts', 'discountproducts'));
    }

    public function allCategories($cat){
        $category = Category::where('name', $cat)->first();
        $subcategories = Category::where('mainid', $category->id)->get();
        $products = Product::where('category', $category->id)->get();
        return view('all-categories', compact('category', 'subcategories', 'products'));
    }

    public function subAllCategories($cat, $id){
        $category = Category::where('id', $cat)->first();
        $subcategory = Category::where('id', $id)->first();
        $subcategories = Category::where('mainid', $category->id)->get();
        $products = Product::where('subcategory', $subcategory->id)->get();
        return view('sub-all-categories', compact('category', 'subcategories', 'products', 'subcategory'));
    }

    public function subCategories($main, $sub){
        $category = Category::where('name', $main)->first();
        $subcategory = Category::where('name', $sub)->first();
        $products = Product::where('subcategory', $subcategory->id)->get();
        return view('sub-categories', compact('category', 'subcategory', 'products'));
    }

    public function singleProduct($id){
        $product = Product::where('id', $id)->first();
        $product->views = $product->views + 1;
        $product->save();
        $products = Product::where('subcategory', $product->subcategory)->orderBy('id','desc')->get();
        $category = Category::where('id', $product->category)->first();
        $similarproducts = [];
        foreach ($products as &$p) {
            $shared = implode( '' , array_intersect( str_split($product->tags) , str_split($p->tags) ) );
            if(strlen($shared) > 3 && $p->id!=$product->id){
                array_push($similarproducts, $p);
            }
        }
        return view('product-single', compact('product', 'similarproducts', 'category'));
    }

    public function getProductsFromCategory($id){
        $category = Category::where('id', $id)->first();
        $products = Product::where('category', $id)->orWhere('subcategory', $id)->orderBy('id','desc')->get();
        return view('categories', compact('products', 'category'));
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function vendorproduct($id)
    {
        $vendor = Vendors::findOrFail($id);
        $products = Product::where('vendorid',$id)->where('status','1')->take(12)->get();
        return view('vendorproduct', compact('products','vendor'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    //Blog Details
    public function blogdetails($id)
    {
        $blog = Blog::findOrFail($id);
        $input['views'] = $blog->views + 1;
        $blog->update($input);
        $recents = Blog::orderBy('id','desc')->take(5)->get();
        return view('blogdetails',compact('blog','recents'));
    }

    //All Blogs
    public function allblog()
    {
        $blogs = Blog::all();
        return view('blogs',compact('blogs'));
    }

    public function cartupdate(Request $request)
    {

        if ($request->isMethod('post')){

            if (empty(Session::get('uniqueid'))){

                $cart = new Cart;
                $cart->fill($request->all());
                Session::put('uniqueid', $request->uniqueid);
                $cart->save();

            }else{

                $cart = Cart::where('uniqueid',$request->uniqueid)
                    ->where('product',$request->product)->first();
                //$carts = Cart::where('uniqueid',$request->uniqueid)
                        //->where('product',$request->product)->count();
                if (count($cart) > 0 ){
                    $data =  $request->all();
                    $cart->update($data);
                }else{
                    $cart = new Cart;
                    $cart->fill($request->all());
                    $cart->save();
                }

            }
            return response()->json(['response' => 'Successfully Added to Cart.','product' => $request->product]);
        }

        $getcart = Cart::where('uniqueid',Session::get('uniqueid'))->get();

        return response()->json(['response' => $getcart]);
    }

    public function cartdelete($id)
    {
        $cartproduct = Cart::where('uniqueid',Session::get('uniqueid'))
            ->where('product',$id)->first();
        $cartproduct->delete();

        $getcart = Cart::where('uniqueid',Session::get('uniqueid'))->get();
        return response()->json(['response' => $getcart]);
    }

    //Submit Review
    public function reviewsubmit(Request $request)
    {
        $review = new Review;
        $review->fill($request->all());
        $review['review_date'] = date('Y-m-d H:i:s');
        $review->save();
        return redirect()->back()->with('message','Your Review Submitted Successfully.');
    }

    //Product Data
    public function productdetails($id,$title)
    {
        $productdata = Product::findOrFail($id);
        $data['views'] = $productdata->views + 1;
        $productdata->update($data);
        $relateds = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$productdata->category[0]])
            ->take(8)->get();
        $gallery = Gallery::where('productid',$id)->get();

        $reviews = Review::where('productid',$id)->get();
        return view('product', compact('productdata','gallery','reviews','relateds'));
    }

    //Category Products
    public function catproduct($slug)
    {
        $sort = "";
        $min = "0";
        $max = "500";
        $mins = "0";
        $maxs = "500";
        if (Input::get('sort') != "") {
            $sort = Input::get('sort');
        }
        if (Input::get('min') != "") {
            $min = Product::Filter(Input::get('min'));
            $mins = Input::get('min');
            $sort = "price";
        }
        if (Input::get('max') != "") {
            $max = Product::Filter(Input::get('max'));
            $maxs = Input::get('max');
            $sort = "price";
        }
        $maxvalue = $products = Product::where('status','1')->max('price');
        $category = Category::where('slug',$slug)->first();
        if ($category === null) {
            $category['name'] = "Nothing Found";
            $products = new \stdClass();
        }else{

            if ($sort=="old") {
                
                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('created_at','asc')
                ->take(9)
                ->get();
                
            }elseif ($sort=="new") {

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('created_at','desc')
                ->take(9)
                ->get();

            }elseif ($sort=="low") {

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('price','asc')
                ->take(9)
                ->get();

            }elseif ($sort=="high") {

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('price','desc')
                ->take(9)
                ->get();

            }elseif ($sort=="price") {

                $products = Product::where('status','1')
                    ->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                    ->whereBetween('price', [$min, $max])
                    ->orderBy('price','asc')
                    ->take(9)
                    ->get();

            }else{

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('created_at','desc')
                ->take(9)
                ->get();
            }
        }
        return view('categoryproduct', compact('products','category','sort','mins','maxs','maxvalue'));
    }

    //Load More Category Products
    public function loadcatproduct($slug,$page)
    {
        $language = SiteLanguage::find(1);
        $settings = Settings::find(1);
        $res = "";
        $min = "0";
        $max = "500";
        $mins = "0";
        $maxs = "500";
        $skip = ($page-1)*9;

        $sort = "";
        if (Input::get('sort') != "") {
            $sort = Input::get('sort');
        }

        if (Input::get('min') != "") {
            $min = Product::Filter(Input::get('min'));
            $mins = Input::get('min');
            $sort = "price";
        }
        if (Input::get('max') != "") {
            $max = Product::Filter(Input::get('max'));
            $maxs = Input::get('max');
            $sort = "price";
        }
        $category = Category::where('slug',$slug)->first();
        if ($category === null) {
            $category['name'] = "Nothing Found";
            $products = new \stdClass();
        }else{

            if ($sort=="old") {
                
                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('created_at','asc')
                ->skip($skip)
                ->take(9)
                ->get();
                
            }elseif ($sort=="new") {

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('created_at','desc')
                ->skip($skip)
                ->take(9)
                ->get();

            }elseif ($sort=="low") {

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('price','asc')
                ->skip($skip)
                ->take(9)
                ->get();

            }elseif ($sort=="high") {

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('price','desc')
                ->skip($skip)
                ->take(9)
                ->get();

            }elseif ($sort=="price") {

                $products = Product::where('status','1')
                    ->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                    ->whereBetween('price', [$min, $max])
                    ->orderBy('price','asc')
                    ->take(9)
                    ->get();

            }else{

                $products = Product::where('status','1')->whereRaw('FIND_IN_SET(?,category)', [$category->id])
                ->orderBy('created_at','desc')
                ->skip($skip)
                ->take(9)
                ->get();
            }


            foreach($products as $product) {
                $res .= '<div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">
                            <div class="single-product-carousel-item text-center">
                                <a href="' . url('/product') . '/' . $product->id . '/' . str_replace(' ', '-', strtolower($product->title)) . '"> <img src="' . url('/assets/images/products') . '/' . $product->feature_image . '" alt="Product Image" /> </a>
                                <div class="product-carousel-text">
                                    <a href="' . url('/product') . '/' . $product->id . '/' . str_replace(' ', '-', strtolower($product->title)) . '">
                                        <h4 class="product-title">' . $product->title . '</h4>
                                    </a>
                                    <div class="ratings">
                                        <div class="empty-stars"></div>
                                        <div class="full-stars" style="width:'.Review::ratings($product->id).'%"></div>
                                    </div>
                                    <div class="product-price">';
                                    if ($product->previous_price != "") {
                                        $res .= '<span class="original-price">' .$settings->currency_sign. $product->previous_price . '</span>';
                                    }
                                    $res .= '
                                       
                                        <del class="offer-price">' .$settings->currency_sign. Product::Cost($product->id) . '</del>
                                    </div>
                                    <div class="product-meta-area">
                                        <form class="addtocart-form">';
                                    if (Session::has('uniqueid')) {
                                        $res .= '<input type="hidden" name="uniqueid" value="' . Session::get('uniqueid') . '">';
                                    } else {
                                        $res .= '<input type="hidden" name="uniqueid" value="' . str_random(7) . '">';
                                    }

                                    $res .= '
                                            <input name="title" value="' . $product->title . '" type="hidden">
                                            <input name="product" value="' . $product->id . '" type="hidden">
                                            <input id="cost" name="cost" value="' . Product::Cost($product->id) . '" type="hidden">
                                            <input id="quantity" name="quantity" value="1" type="hidden">';
                                    if ($product->stock != 0){
                                        $res .='<button type="button" onclick="toCart(this)" class="addTo-cart to-cart"><i class="fa fa-cart-plus"></i><span>'.$language->add_to_cart.'</span></button>';
                                    }else{
                                        $res .='<button type="button" class="addTo-cart  to-cart" disabled><i class="fa fa-cart-plus"></i>'.$language->out_of_stock.'</button>';
                                    }
                                    $res .=' 
                                            
                                        </form>
                                        <a  href="javascript:;" class="wish-list" onclick="getQuickView('.$product->id.')" data-toggle="modal" data-target="#myModal">
                                            <i class="fa fa-eye"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>';
            }

        }
        return $res;
    }
    //Load More Vendor Products
    public function loadvendproduct($id,$page)
    {
        $language = SiteLanguage::find(1);
        $settings = Settings::find(1);
        $res = "";
        $skip = ($page-1)*12;


        $products = Product::where('vendorid',$id)->where('status','1')
        ->orderBy('created_at','asc')
        ->skip($skip)
        ->take(12)
        ->get();

            foreach($products as $product) {
                $res .= '<div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">
                            <div class="single-product-carousel-item text-center">
                                <a href="' . url('/product') . '/' . $product->id . '/' . str_replace(' ', '-', strtolower($product->title)) . '"> <img src="' . url('/assets/images/products') . '/' . $product->feature_image . '" alt="Product Image" /> </a>
                                <div class="product-carousel-text">
                                    <a href="' . url('/product') . '/' . $product->id . '/' . str_replace(' ', '-', strtolower($product->title)) . '">
                                        <h4 class="product-title">' . $product->title . '</h4>
                                    </a>
                                    <div class="ratings">
                                        <div class="empty-stars"></div>
                                        <div class="full-stars" style="width:'.Review::ratings($product->id).'%"></div>
                                    </div>
                                    <div class="product-price">';
                if ($product->previous_price != "") {
                    $res .= '<span class="original-price">' .$settings->currency_sign. $product->previous_price . '</span>';
                }
                $res .= '
                                       
                                        <del class="offer-price">' .$settings->currency_sign. Product::Cost($product->id) . '</del>
                                    </div>
                                    <div class="product-meta-area">
                                        <form class="addtocart-form">';
                if (Session::has('uniqueid')) {
                    $res .= '<input type="hidden" name="uniqueid" value="' . Session::get('uniqueid') . '">';
                } else {
                    $res .= '<input type="hidden" name="uniqueid" value="' . str_random(7) . '">';
                }

                $res .= '
                                                            <input name="title" value="' . $product->title . '" type="hidden">
                                                            <input name="product" value="' . $product->id . '" type="hidden">
                                                            <input id="cost" name="cost" value="' . Product::Cost($product->id) . '" type="hidden">
                                                            <input id="quantity" name="quantity" value="1" type="hidden">';
                if ($product->stock != 0){
                    $res .='<button type="button" onclick="toCart(this)" class="addTo-cart to-cart"><i class="fa fa-cart-plus"></i><span>'.$language->add_to_cart.'</span></button>';
                }else{
                    $res .='<button type="button" class="addTo-cart  to-cart" disabled><i class="fa fa-cart-plus"></i>'.$language->out_of_stock.'</button>';
                }
                $res .=' 
                                            
                                        </form>
                                        <a  href="javascript:;" class="wish-list" onclick="getQuickView('.$product->id.')" data-toggle="modal" data-target="#myModal">
                                            <i class="fa fa-eye"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>';
            }
        return $res;
    }

    //Search Products
    public function searchProduct(Request $request)
    {
        $search = $request->search;
        $searches = explode(" ", $search);
        $products = array();
        foreach ($searches as $key => $input) {
            $tempproducts = Product::where('status','1')->where('title', 'like', '%' . $input . '%')
                ->orwhere('tags', 'like', '%' . $input . '%')
                ->get();
            $products= array_merge($tempproducts->toarray(), $products);
        }
        $products = Product::where('status','1')->where('title', 'like', '%' . $input . '%')
                ->orwhere('tags', 'like', '%' . $input . '%')
                ->get();
        return view('search', compact('products','search'));
    }

    //Tags Products
    public function tagproduct($tag)
    {
       $products = Product::where('status','1')->where('tags', 'like', '%' . $tag . '%')
                ->get();
       return view('tagsproduct', compact('products','tag'));
    }


    public function cashondelivery(Request $request)
    {
        $settings = Settings::findOrFail(1);
        $order = new Order;
        $success_url = action('PaymentController@payreturn');
        $item_name = $settings->title." Order";
        $item_number = str_random(4).time();
        $item_amount = $request->total;

        $order['customerid'] = $request->customer;
        $order['products'] = $request->products;
        $order['quantities'] = $request->quantities;
        $order['sizes'] = $request->sizes;
        $order['pay_amount'] = $item_amount;
        $order['method'] = "Cash On Delivery";
        $order['shipping'] = $request->shipping;
        $order['pickup_location'] = $request->pickup_location;
        $order['customer_email'] = $request->email;
        $order['customer_name'] = $request->name;
        $order['customer_phone'] = $request->phone;
        $order['booking_date'] = date('Y-m-d H:i:s');
        $order['order_number'] = $item_number;
        $order['customer_address'] = $request->address;
        $order['customer_city'] = $request->city;
        $order['customer_zip'] = $request->zip;
        $order['shipping_email'] = $request->shipping_email;
        $order['shipping_name'] = $request->shipping_name;
        $order['shipping_phone'] = $request->shipping_phone;
        $order['shipping_address'] = $request->shipping_address;
        $order['shipping_city'] = $request->shipping_city;
        $order['shipping_zip'] = $request->shipping_zip;
        $order['order_note'] = $request->order_note;
        $order['payment_status'] = "Completed";
        $order->save();
        $orderid = $order->id;
        $pdata = explode(',',$request->products);
        $qdata = explode(',',$request->quantities);
        $sdata = explode(',',$request->sizes);

        foreach ($pdata as $data => $product){
            $proorders = new OrderedProducts();

            $productdet = Product::findOrFail($product);

            $proorders['orderid'] = $orderid;
            $proorders['owner'] = $productdet->owner;
            $proorders['vendorid'] = $productdet->vendorid;
            $proorders['productid'] = $product;
            $proorders['quantity'] = $qdata[$data];
            $proorders['size'] = $sdata[$data];
            $proorders['cost'] = $productdet->price * $qdata[$data];
            $proorders->save();

            $stocks = $productdet->stock - $qdata[$data];
            if ($stocks < 0){
                $stocks = 0;
            }
            $quant['stock'] = $stocks;
            $productdet->update($quant);
            
            if($productdet->owner != "admin"){
	 	    $vendordet = Vendors::findOrFail($productdet->vendorid);
	            //Sending Email To Seller
	            	$to = $vendordet->email;
			$subject = "New Order Recieved!!";
			$msg = "Hello ".$vendordet->name."!\nYou have recieved a new order. Please login to your panel to check. \nThank you.";
			$headers = "From: ".$settings->title."<".$settings->email.">";
			mail($to,$subject,$msg,$headers);
            }

        }

        Cart::where('uniqueid',Session::get('uniqueid'))->delete();
        
        //Sending Email To Buyer
        $to = $request->email;
		$subject = "Your Order Placed!!";
		$msg = "Hello ".$request->name."!\nYou have placed a new order. Please wait for your delivery. \nThank you.";
		$headers = "From: ".$settings->title."<".$settings->email.">";
		mail($to,$subject,$msg,$headers);   
		     
        //Sending Email To Admin
            	$to = $settings->email;
		$subject = "New Order Recieved!!";
		$msg = "Hello Admin!\nYour store has recieved a new order. Please login to your panel to check. \nThank you.";
		$headers = "From: ".$settings->title."<".$settings->email.">";
		mail($to,$subject,$msg,$headers);

        return redirect($success_url);
    }

    public function mobilemoney(Request $request)
    {
        $settings = Settings::findOrFail(1);
        $order = new Order;
        $success_url = action('PaymentController@payreturn');
        $item_name = $settings->title." Order";
        $item_number = str_random(4).time();
        $item_amount = $request->total;

        $order['customerid'] = $request->customer;
        $order['products'] = $request->products;
        $order['quantities'] = $request->quantities;
        $order['sizes'] = $request->sizes;
        $order['pay_amount'] = $item_amount;
        $order['method'] = "Mobile Money";
        $order['shipping'] = $request->shipping;
        $order['pickup_location'] = $request->pickup_location;
        $order['customer_email'] = $request->email;
        $order['customer_name'] = $request->name;
        $order['customer_phone'] = $request->phone;
        $order['booking_date'] = date('Y-m-d H:i:s');
        $order['order_number'] = $item_number;
        $order['customer_address'] = $request->address;
        $order['customer_city'] = $request->city;
        $order['customer_zip'] = $request->zip;
        $order['shipping_email'] = $request->shipping_email;
        $order['shipping_name'] = $request->shipping_name;
        $order['shipping_phone'] = $request->shipping_phone;
        $order['shipping_address'] = $request->shipping_address;
        $order['shipping_city'] = $request->shipping_city;
        $order['shipping_zip'] = $request->shipping_zip;
        $order['order_note'] = $request->order_note;
        $order['txnid'] = $request->txn_id;
        $order['payment_status'] = "Completed";
        $order->save();
        $orderid = $order->id;
        $pdata = explode(',',$request->products);
        $qdata = explode(',',$request->quantities);
        $sdata = explode(',',$request->sizes);

        foreach ($pdata as $data => $product){
            $proorders = new OrderedProducts();

            $productdet = Product::findOrFail($product);

            $proorders['orderid'] = $orderid;
            $proorders['owner'] = $productdet->owner;
            $proorders['vendorid'] = $productdet->vendorid;
            $proorders['productid'] = $product;
            $proorders['quantity'] = $qdata[$data];
            $proorders['size'] = $sdata[$data];
            $proorders['cost'] = $productdet->price * $qdata[$data];
            $proorders->save();

            $stocks = $productdet->stock - $qdata[$data];
            if ($stocks < 0){
                $stocks = 0;
            }
            $quant['stock'] = $stocks;
            $productdet->update($quant);
                    
            if($productdet->owner != "admin"){
	 	    $vendordet = Vendors::findOrFail($productdet->vendorid);
	            //Sending Email To Seller
	            	$to = $vendordet->email;
			$subject = "New Order Recieved!!";
			$msg = "Hello ".$vendordet->name."!\nYou have recieved a new order. Please login to your panel to check. \nThank you.";
			$headers = "From: ".$settings->title."<".$settings->email.">";
			mail($to,$subject,$msg,$headers);
            }
            
            
        }

        Cart::where('uniqueid',Session::get('uniqueid'))->delete();
        
        //Sending Email To Buyer
            	$to = $request->email;
		$subject = "Your Order Placed!!";
		$msg = "Hello ".$request->name."!\nYou have placed a new order. Please wait for your delivery. \nThank you.";
		$headers = "From: ".$settings->title."<".$settings->email.">";
		mail($to,$subject,$msg,$headers);   
		     
        //Sending Email To Admin
            	$to = $settings->email;
		$subject = "New Order Recieved!!";
		$msg = "Hello Admin!\nYour store has recieved a new order. Please login to your panel to check. \nThank you.";
		$headers = "From: ".$settings->title."<".$settings->email.">";
		mail($to,$subject,$msg,$headers);
		
        return redirect($success_url);
    }

    public function bankwire(Request $request)
    {
        $settings = Settings::findOrFail(1);
        $order = new Order;
        $success_url = action('PaymentController@payreturn');
        $item_name = $settings->title." Order";
        $item_number = str_random(4).time();
        $item_amount = $request->total;

        $order['customerid'] = $request->customer;
        $order['products'] = $request->products;
        $order['quantities'] = $request->quantities;
        $order['sizes'] = $request->sizes;
        $order['pay_amount'] = $item_amount;
        $order['method'] = "Bank Wire";
        $order['shipping'] = $request->shipping;
        $order['pickup_location'] = $request->pickup_location;
        $order['customer_email'] = $request->email;
        $order['customer_name'] = $request->name;
        $order['customer_phone'] = $request->phone;
        $order['booking_date'] = date('Y-m-d H:i:s');
        $order['order_number'] = $item_number;
        $order['customer_address'] = $request->address;
        $order['customer_city'] = $request->city;
        $order['customer_zip'] = $request->zip;
        $order['shipping_email'] = $request->shipping_email;
        $order['shipping_name'] = $request->shipping_name;
        $order['shipping_phone'] = $request->shipping_phone;
        $order['shipping_address'] = $request->shipping_address;
        $order['shipping_city'] = $request->shipping_city;
        $order['shipping_zip'] = $request->shipping_zip;
        $order['order_note'] = $request->order_note;
        $order['txnid'] = $request->txn_id;
        $order['payment_status'] = "Completed";
        $order->save();
        $orderid = $order->id;
        $pdata = explode(',',$request->products);
        $qdata = explode(',',$request->quantities);
        $sdata = explode(',',$request->sizes);

        foreach ($pdata as $data => $product){
            $proorders = new OrderedProducts();

            $productdet = Product::findOrFail($product);

            $proorders['orderid'] = $orderid;
            $proorders['owner'] = $productdet->owner;
            $proorders['vendorid'] = $productdet->vendorid;
            $proorders['productid'] = $product;
            $proorders['quantity'] = $qdata[$data];
            $proorders['size'] = $sdata[$data];
            $proorders['cost'] = $productdet->price * $qdata[$data];
            $proorders->save();

            $stocks = $productdet->stock - $qdata[$data];
            if ($stocks < 0){
                $stocks = 0;
            }
            $quant['stock'] = $stocks;
            $productdet->update($quant);
                    
            if($productdet->owner != "admin"){
	 	    $vendordet = Vendors::findOrFail($productdet->vendorid);
	            //Sending Email To Seller
	            	$to = $vendordet->email;
			$subject = "New Order Recieved!!";
			$msg = "Hello ".$vendordet->name."!\nYou have recieved a new order. Please login to your panel to check. \nThank you.";
			$headers = "From: ".$settings->title."<".$settings->email.">";
			mail($to,$subject,$msg,$headers);
            }
            
            
        }

        Cart::where('uniqueid',Session::get('uniqueid'))->delete();
        
        //Sending Email To Buyer
            	$to = $request->email;
		$subject = "Your Order Placed!!";
		$msg = "Hello ".$request->name."!\nYou have placed a new order. Please wait for your delivery. \nThank you.";
		$headers = "From: ".$settings->title."<".$settings->email.">";
		mail($to,$subject,$msg,$headers);   
		     
        //Sending Email To Admin
            	$to = $settings->email;
		$subject = "New Order Recieved!!";
		$msg = "Hello Admin!\nYour store has recieved a new order. Please login to your panel to check. \nThank you.";
		$headers = "From: ".$settings->title."<".$settings->email.">";
		mail($to,$subject,$msg,$headers);
		
        return redirect($success_url);
    }

    //Product Quick View
    public function getProduct($id)
    {
        $language = SiteLanguage::find(1);
        $profiledata = Product::findOrFail($id);
        $data = '<div class="col-md-3 col-sm-12">
                    <div class="product-review-details-img">
                        <img src="' . url('/') . '/assets/images/products/' . $profiledata->feature_image . '" alt="">
                    </div>
                </div>
                <div class="col-md-9 col-sm-12">
                    <div class="product-review-details-description">
                        <h3>' . $profiledata->title . '</h3>
                        <div class="ratings">
                            <div class="empty-stars"></div>
                            <div class="full-stars" style="width:' . Review::ratings($profiledata->id) . '%"></div>
                        </div>
                        <div class="product-price">
                            <div class="single-product-price">
                                $' . $profiledata->price . '
                            </div>
                            <div class="product-availability">';
        if ($profiledata->stock != 0 || $profiledata->stock === null) {
            $data .= '<span class="available">
                            <i class="fa fa-check-square-o"></i>
                            <span>' . $language->available . '</span>
                        </span>';
        }else{
            $data .= '<span class="not-available">
                    <i class="fa fa-times-circle-o"></i>
                    <span>' . $language->out_of_stock.'</span>
                    </span>';
                }
                            $data .='</div>
                        </div>
                        <div class="product-review-description">
                            <h4>'.$language->quick_review.'</h4>
                            <p>'.$profiledata->description.'</p>
                        </div>
                        <div class="product-quantity">
                            <a href="'.url('/').'/product/'.$profiledata->id.'/'.str_replace(' ','-',strtolower($profiledata->title)).'" class="addToCart-btn">'.$language->view_details.'</a>
                        </div>
                    </div>
                </div>';
        return $data;
    }

    //Profile Data
    public function account()
    {
        //$profiledata = UserProfile::findOrFail($id);
        return view('account');
    }

    //Contact Page Data
    public function contact()
    {
        $pagedata = PageSettings::find(1);
        return view('contact', compact('pagedata'));
    }

    //About Page Data
    public function about()
    {
        $pagedata = PageSettings::find(1);
        return view('about', compact('pagedata'));
    }

    //FAQ Page Data
    public function faq()
    {
        $pagedata = PageSettings::find(1);
        $faqs = FAQ::all();
        return view('faq', compact('pagedata','faqs'));
    }

    //Show Category Users
    public function category($category)
    {
        $categories = Category::where('slug', $category)->first();
        $services = Service::where('status', 1)
            ->where('category', $categories->id)
            ->get();
        $pagename = "All Sevices in: ".ucwords($categories->name);
        return view('services', compact('services','pagename','categories'));
    }


    //Show Cart
    public function cart()
    {
        $sum = 0.00;
        $carts = new \stdClass();
        if (Session::has('uniqueid')){
            $carts = Cart::where('uniqueid', Session::get('uniqueid'))->get();
            $sum = Cart::where('uniqueid', Session::get('uniqueid'))->sum('cost');
        }
        return view('cart', compact('carts','sum'));
    }

    //User Subscription
    public function subscribe(Request $request)
    {
        $exist = Subscribers::where('email',$request->email);

        if ($exist->count() > 0){

            return "<span style=\"color:#F90600;\">You are already Subscribed.</span>";
        }else{
            $subscribe = new Subscribers;
            $subscribe->fill($request->all());
            $subscribe->save();
            return "<span style=\"color:#00C708;\">You are subscribed Successfully.</span>";
        }
    }

    //Send email to Admin
    public function contactmail(Request $request)
    {
        $pagedata = PageSettings::findOrFail(1);
        $setting = Settings::findOrFail(1);
        $subject = "Contact From Of ".$setting->title;
        $to = $request->to;
        $name = $request->name;
        $phone = $request->phone;
        $from = $request->email;
        $msg = "Name: ".$name."\nEmail: ".$from."\nPhone: ".$request->phone."\nMessage: ".$request->message;

        mail($to,$subject,$msg);

        Session::flash('cmail', $pagedata->contact);
        return redirect('/contact');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}

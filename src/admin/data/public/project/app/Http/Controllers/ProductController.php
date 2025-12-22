<?php

namespace App\Http\Controllers;
use App\FileHelper;
use Illuminate\Support\Facades\Log;

use App\Category;
use App\Gallery;
use App\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class ProductController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $products = Product::orderBy('id','desc')->get();
        return view('admin.productlist',compact('products'));
    }


    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $categories = Category::where('role','main')->get();
        return view('admin.productadd',compact('categories'));
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {        

        $data = new Product();
        $data->fill($request->all());
        $data->category = $request->mainid;
        $data->subcategory = $request->subid;
        $data->code = "#EMIPROD".rand(1000, 10000);
        if ($file = $request->file('photo')){
            $photo_name = time().$request->file('photo')->getClientOriginalName();
            $file->move('assets/images/products',$photo_name);
            $data['feature_image'] = $photo_name;
            FileHelper::moveCacheToImages("products", "assets/images/products/".$photo_name, $photo_name);
        }
        $data->featured = 1;
        $lastid = $data->id;
        $images = "";
        if ($files = $request->file('gallery')){
            foreach ($files as $file){
                $image_name = str_random(2).time().$file->getClientOriginalName();
                $file->move('assets/images/gallery',$image_name);
                FileHelper::moveCacheToImages("products", "assets/images/gallery/".$image_name, $image_name);
                if($images == ""){
                    $images=$image_name;
                }else {
                    $images = $images . "," . $image_name;
                }
            }
            $data->images = $images;
        }
        $data->save();
        Session::flash('message', 'New Product Added Successfully.');
        return redirect('admin/products');
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

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $product = Product::findOrFail($id);
        $subs = Category::where('role','sub')->where('mainid',$product->category)->get();
        $categories = Category::where('role','main')->get();
        return view('admin.productedit',compact('product','categories','subs'));
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
        $product = Product::findOrFail($id);
        $input = $request->all();
        $input['category'] = $request->mainid.",".$request->subid.",".$request->childid;

        if ($file = $request->file('photo')){
            $photo_name = time().$request->file('photo')->getClientOriginalName();
            $file->move('assets/images/products',$photo_name);
            FileHelper::moveCacheToImages("products", "assets/images/products/".$image_name, $image_name);

            $input['feature_image'] = $photo_name;
        }

        if ($request->galdel == 1){
            $gal = Gallery::where('productid',$id);
            $gal->delete();
        }

        if ($request->pallow == ""){
            $input['sizes'] = null;
        }

        $input['featured'] = 1;
        
        $images = "";
        if ($files = $request->file('gallery')){
            foreach ($files as $file){
                $image_name = str_random(2).time().$file->getClientOriginalName();
                $file->move('assets/images/gallery',$image_name);
                FileHelper::moveCacheToImages("products", "assets/images/gallery/".$image_name, $image_name);
                if($images == ""){
                    $images=$image_name;
                }
                else {
                    $images = $images . "," . $image_name;
                }
            }

            $input['images'] =$images;
        }
        $product->update($input);

        Session::flash('message', 'Product Updated Successfully.');
        return redirect('admin/products');
    }

    public function status($id , $status)
    {
        $product = Product::findOrFail($id);
        $input['status'] = $status;

        $product->update($input);
        Session::flash('message', 'Product Status Updated Successfully.');
        return redirect('admin/products');
    }
    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        unlink('assets/images/products/'.$product->feature_image);
        FileHelper::removeImageFile("products", "assets/images/products/".$product->feature_image, $product->feature_image);
        $images =  explode(',', $product->images);
        foreach ($images as $image){
            FileHelper::removeImageFile("products", "assets/images/products/".$image, $image);
        }
        $product->delete();
        return redirect('admin/products')->with('message','Product Delete Successfully.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Category;
// use App\Counter;
// use App\Gallery;
use App\Product;
// use App\SectionTitles;
// use App\ServiceSection;
// use App\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Input;
use App\FileHelper;

class ApiController extends Controller
{

    function getCategories(){

        $categories = Category::where('role', 'sub')->get();
        return json_encode($categories);
    }


    function add(Request $request){

        
        $data = new Product();
        $data->fill($request->all());
        $data->category = $request->category;
        $data->subcategory = $request->subcategory;
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
        return json_encode($data);
    }
}

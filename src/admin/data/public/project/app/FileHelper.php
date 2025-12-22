<?php

namespace App;
use Illuminate\Support\Facades\File;
use Storage;

class FileHelper
{
    public static function moveCacheToImages(string $item, string $imagepath, string $imagename)
    {
        if (File::exists($imagepath)) {
            Storage::disk('imagekit')->put("emishops/". $item . "/" .$imagename , base64_encode(file_get_contents($imagepath)));
        }
    }

    public static function removeImageFile(string $item, string $localpath, string $imagename)
    {
        if (File::exists($localpath)) {
            File::delete($localpath);
        }
        Storage::disk('imagekit')->delete("emishops/". $item . "/" .$imagename );
    }

}

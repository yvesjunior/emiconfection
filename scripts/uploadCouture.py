import requests
import os
import pathlib
import binascii

def encode_multipart_formdata(fields):
    boundary = binascii.hexlify(os.urandom(16)).decode('ascii')

    body = (
        "".join("--%s\r\n"
                "Content-Disposition: form-data; name=\"%s\"\r\n"
                "\r\n"
                "%s\r\n" % (boundary, field, value)
                for field, value in fields.items()) +
        "--%s--\r\n" % boundary
    )

    content_type = "multipart/form-data; boundary=%s" % boundary

    return body, content_type

url = "https://emishops.net/addproduct"
directory = "/Users/bationoyvesjunior/coutures"


title = "Couture - Pagne tissé"
description = "<ul><li>Couture - Pagne tissé du Ghana&nbsp;</li></li><li>Pour vos cérémonies et mariages</li></ul>"
price = 50000
stock = 0
tags = ""
views = 0
photo = ""
for subdir in os.listdir(directory):
    f = os.path.join(directory, subdir)
    # checking if it is a file
    if os.path.isdir(f):
        # print(f)

      ## ADD product
      files = []
      i = 0
      for file in os.listdir(f):
        f2 = os.path.join(f, file)
        if os.path.isfile(f2) :
          file_extension = pathlib.Path(f2).suffix
          if file_extension == ".jpeg" or file_extension == ".jpg":
            if file == "1.jpeg" or file == "1.jpg":
              files.append(('photo', (file, open(f2, 'rb'), 'image/png')))
            files.append(("gallery[" + str(i) +"]", (file, open(f2, 'rb'), 'image/png')))
            i = i + 1

          if file_extension == ".txt":
            with open(f2) as f3:
              tags = f3.read().lower()

      payload={
        "category": "71",
        "subcategory": "72",
        "title": title,
        "tags": tags,
        "description": description,
        "price": price,
        "stock": stock,
        "views": views
      }
      r = requests.post(url, files=files, data=payload)
      print(f"{f}")
      print(f"===: {r.text}")
      print("")
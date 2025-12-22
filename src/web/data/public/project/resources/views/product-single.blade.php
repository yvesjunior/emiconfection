<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>EmiShops </title>
    <meta name="description"
        content="Tissus - Kente - Vêtements - Mariages - Cérémonies" />
    <link rel="shortcut icon" href="/assets-ui/images/favicon.png" type="image/f-icon" />

    <!-- font awesome -->
    <link rel="stylesheet" href="/assets-ui/css/all.min.css" />
    <!-- bootstraph -->
    <link rel="stylesheet" href="/assets-ui/css/bootstrap.min.css" />
    <!-- Fancy Box -->
    <link rel="stylesheet" href="/assets-ui/css/jquery.fancybox.min.css" />
    <!-- swiper js -->
    <link rel="stylesheet" href="/assets-ui/css/swiper-bundle.min.css" />
    <!-- Nice Select -->
    <link rel="stylesheet" href="/assets-ui/css/nice-select.css" />
    <!-- Countdown js -->
    <link rel="stylesheet" href="/assets-ui/css/jquery.countdown.css" />
    <!-- User's CSS Here -->
    <link rel="stylesheet" href="/assets-ui/css/style.css" />
</head>

<body>
    <!-- Header Start  -->
    <header class="header header-sticky">
        <div class="container">
            <!-- Header Top Start -->
            <div class="header__top">
                <div class="header__left">
                    <!-- Header Toggle Start -->
                    <div class="header__toggle d-lg-none">
                        <button class="toggler__btn">
                            <svg width="18" height="12" viewBox="0 0 18 12" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M0 12H18V10H0V12ZM0 7H18V5H0V7ZM0 0V2H18V0H0Z" fill="#667085" />
                            </svg>
                        </button>
                    </div>
                    <!-- Header Toggle End -->
                    <div class="header__logo">
                        <a href="/"><img src="/assets-ui/images/logo/logo.png" alt="logo" /> </a>
                    </div>
                    <div class="search__form__wrapper">
                        <form action="/search" method="post" class="search__form">
                        {{ csrf_field() }}
                            <div class="select__style">
                                <select name="filter" class="category-select">
<option value="Tous">Tous</option>
<option value="Kentes">Kentes</option>
<option value="Tissus">Tissus</option>

<option value="Accessoires">Accessoires</option>
                                </select>
                            </div>
                            <input type="search" class="form-control" name="search"
                                placeholder="Recherchez  une couleur ..." />
                            <button type="submit">
                                <img src="/assets-ui/images/search.png" alt="search" />
                            </button>
                        </form>
                    </div>
                </div>
                <div class="header__meta">

                    <ul class="meta__item">
                        <li>
                            <a href="#" data-bs-toggle="modal" data-bs-target="#signup">
                                <i class="fa-solid fa-user-plus"></i>
                                <span>Sign up</span>
                            </a>
                        </li>
                    </ul>
                    <div class="miniCart">
                        <div class="header__cart">
                            <a href="#" class="cart__btn">
                                <div class="cart__btn-img">
                                    <img src="/assets-ui/images/cart-icon.png" alt="cart-icon" />
                                    <!-- <span class="value">10</span> -->
                                </div>
                                <span class="title">Panier</span>
                            </a>
                        </div>
                    </div>
                </div>
                <!-- Header Top End -->
            </div>
            <!-- Search Form -->
            <form action="/search" method="post" class="search__form full__width d-lg-none d-flex">
            {{ csrf_field() }}
                <div class="select__style">
                    <select name="filter" class="category-select">
<option value="Tous">Tous</option>
<option value="Kentes">Kentes</option>
<option value="Tissus">Tissus</option>

<option value="Accessoires">Accessoires</option>
                    </select>
                </div>
                <input type="search" class="form-control" name="search" placeholder="Recherchez  une couleur ..." />
                <button type="submit">
                    <img src="/assets-ui/images/search.png" alt="search" />
                </button>
            </form>
            <!-- Search Form -->
        </div>
        <nav class="nav d-none d-lg-flex">
            <div class="container">
                <!-- Header Wrap Start  -->
                <div class="header__wrapper">
                    <div class="header__menu">
                        <ul class="main__menu">
                            <li class="has__dropdown">
                                <a href="/">Home</a>
                            </li>
                            @if($category->name == "tissus")
                            <li class="has__dropdown position-static active">
                            @else
                            <li class="has__dropdown position-static">
                            @endif                                <a href="#">Tissus</a>
                                <div class="mega__menu sub__menu">
                                    <ul class="mega__menu-item">

                                        <li class="sub-mega__menu">
                                            <a class="menu__title" href="/all-categories/tissus">Tissus</a>
                                            <ul>
                                                <li><a href="/sub-categories/tissus/kentes">Kentes</a></li>
                                                
                                                
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                            @if($category->name == "coutures")
                            <li class="has__dropdown position-static active">
                            @else
                            <li class="has__dropdown position-static">
                            @endif                                <a href="#">Coutures</a>
                                <div class="mega__menu sub__menu">
                                    <ul class="mega__menu-item">
                                        <li class="sub-mega__menu">
                                            <a class="menu__title" href="/all-categories/coutures">Coutures</a>
                                            <ul>
                                                <li><a href="/sub-categories/coutures/femmes">Femmes</a></li>
                                                <li><a href="/sub-categories/coutures/hommes">Hommes</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </li>                            
                            @if($category->name == "accessoires")
                            <li class="has__dropdown position-static active">
                            @else
                            <li class="has__dropdown position-static">
                            @endif                                <a href="#">Accessoires</a>
                                <div class="mega__menu sub__menu">
                                    <ul class="mega__menu-item">
                                        <li class="sub-mega__menu">
                                            <a class="menu__title" href="/all-categories/accessoires">Accessoires</a>
                                            <ul>
                                                <li><a href="/sub-categories/accessoires/meches">Mêches</a></li>
                                                <li><a href="/sub-categories/accessoires/perruques">Perruques</a></li>
                                                <li><a href="/sub-categories/accessoires/éventails">Éventails</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="header__meta">
                        <ul class="meta__item">
                            <li>
                                <a href="tel:+0125698989"><i class="fa-solid fa-phone-flip"></i>+226 61-00-45-93/+226 55-40-49-95</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <!-- Header Wrap End  -->
            </div>
        </nav>
    </header>
    <!-- Header End -->

    <!-- product detail section start  -->
    <section class="product-main">
        <div class="container">
            <div class="row product-detail">
                <div class="col-md-6">
                    <div class="product-gallery">
                        <div class="product-gallery__thumb swiper productGallerySwiperThumb">
                            <div class="swiper-wrapper">
                                @foreach(explode(',', $product->images) as $image)
                                <div class="swiper-slide">
                                    <div class="gallery-item">
                                        <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-80,co-FFFFFF,l-end/{{$image}}" alt="product" />
                                    </div>
                                </div>
                                @endforeach
                            </div>
                        </div>
                        <div class="product-gallery__main swiper productGallerySwiper">
                            <div class="swiper-wrapper">
                                @foreach(explode(',', $product->images) as $image)
                                <div class="swiper-slide">
                                    <div class="gallery-item">
                                        <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$image}}" alt="product iamge" />
                                    </div>
                                </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="product-detail__wrapper">
                        <h2 class="product-detail__title">{{$product->title}}</h2>
                        <div class="product-detail__meta">
                            <ul class="right-meta">
                                <li>
                                    <a href="#" class="share__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M2.6665 8V13.3333C2.6665 13.687 2.80698 14.0261 3.05703 14.2761C3.30708 14.5262 3.64622 14.6667 3.99984 14.6667H11.9998C12.3535 14.6667 12.6926 14.5262 12.9426 14.2761C13.1927 14.0261 13.3332 13.687 13.3332 13.3333V8"
                                                stroke="#002642" stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M10.6668 3.99998L8.00016 1.33331L5.3335 3.99998" stroke="#002642"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M8 1.33331V9.99998" stroke="#002642" stroke-linecap="round"
                                                stroke-linejoin="round" />
                                        </svg>
                                        Partager
                                    </a>
                                </li>
                                @if($product->stock > 0)
                                    <li>
                                        <div class="stock__item">En stock</div>
                                    </li>
                                @else
                                    <li>
                                        <div class="stock__item text-danger">Non disponible</div>
                                    </li>  
                                @endif
                            </ul>
                        </div>
                        <h3 class="product-detail__price">
                        @foreach(explode(',', $product->tags) as $tag)
                            #{{trim($tag)}}
                        @endforeach
                                                        </h3>
                        <div class="product-detail__short_desc">
                         {!! $product->description !!}

                        </div>
                       
                        <div class="product-detail__action">
                            <!-- <div class="item">
                                <a href="#" class="btn btn-primary btn-outline">Add to Panier</a>
                            </div> -->
                            <div class="item">
                                <a href="//api.whatsapp.com/send?phone=22661004593&text=Bonjour, je suis interessé par ce article https://emishops.net/product-single/{{$product->id}} ." target="_blank" class="btn btn-primary btn-filled">Je suis intéressé</a>
                            </div>
                        </div>
                        <div class="product-detail__accordion accordion" id="productDetailAccordion">
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="accordionOne">
                                    <button class="accordion-button product-detail--stroke collapsed" type="button"
                                        data-bs-toggle="collapse" data-bs-target="#accordion_one"
                                        aria-controls="accordion_one">
                                        Option de livraison
                                    </button>
                                </h2>
                                <div id="accordion_one" class="accordion-collapse collapse"
                                    aria-labelledby="accordionOne" data-bs-parent="#productDetailAccordion">
                                    <div class="accordion-body">
                                        <p>Livraison partout en Afrique, France, Canada, USA</p>
                                    </div>
                                </div>
                            </div>
                         
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- product detail section end -->

    <!-- Trending Section Start -->
    @if(count($similarproducts) > 0)
    <section class="trending__section pt-0">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <h2> Produits Similaires</h2>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="product__wrapper swiper__pagination">
                        <div class="swiper trending__Swiper">
                            <div class="swiper-wrapper">
                                @foreach($similarproducts as $product)
                                <div class="swiper-slide">
                                    <div class="product-card">
                                        <div class="product__image__wrapper">
                                            <a href="/product-single/{{$product->id}}" class="product__image">
                                                <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}" alt="icon" />
                                            </a>
                                            <div class="badge">solde -10%</div>
                                            <div class="product__actions">
                                                
                                                <a href="/product-single/{{$product->id}}" 
                                                    class="action__btn">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="M0.666992 7.99996C0.666992 7.99996 3.33366 2.66663 8.00033 2.66663C12.667 2.66663 15.3337 7.99996 15.3337 7.99996C15.3337 7.99996 12.667 13.3333 8.00033 13.3333C3.33366 13.3333 0.666992 7.99996 0.666992 7.99996Z"
                                                            stroke="#252522" stroke-linecap="round"
                                                            stroke-linejoin="round" />
                                                        <path
                                                            d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                                                            stroke="#252522" stroke-linecap="round"
                                                            stroke-linejoin="round" />
                                                    </svg>
                                                </a>
                                                
                                            </div>
                                        </div>
                                        <div class="product__content">

                                            <div class="product__title">
                                                <h5><a href="/product-single/{{$product->id}}">{{$product->title}}</a></h5>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                @endforeach
                            </div>

                            <div class="swiper-slide">
                                <div class="swiper-button-next">
                                    <svg width="35" height="16" viewBox="0 0 35 16" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2" stroke-linecap="round"
                                            stroke-linejoin="round" />
                                        <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </div>
                            </div>
                            <div class="swiper-button-prev">
                                <svg width="23" height="16" viewBox="0 0 23 16" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22 8H1" stroke="#D0D5DD" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path d="M8 15L1 8L8 1" stroke="#D0D5DD" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                            </div>
                            <div class="swiper-pagination"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    @endif
    <!-- Trending Section End -->

    <!-- Footer Section Start -->
    <footer class="footer__section">

        <div class="footer__bottom">
            <div class="container">
                <div class="row">
                    <div class="col-12">
                        <div class="footer__content text-center">
                            <div class="content">
                                <p>
                                    &copy; 2022
                                    <a href="#">EmiShops</a>. All rights reserved
                                </p>
                            </div>
                            <div class="link">
                                
                                <!-- <a href="#"><i class="fa-brands fa-linkedin"></i></a> -->
                                <a href="https://web.facebook.com/nitiemae"><i class="fa-brands fa-facebook"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>
    <!-- Footer Section End -->

    <!-- Header Flyout Menu Start -->
    <div class="flyoutMenu">
        <div class="flyout__flip">
            <div class="flyout__inner">
                <div class="menu__header-top">
                    <div class="brand__logo">
                        <a href="/"><img src="/assets-ui/images/logo/logo.png" alt="logo" /></a>
                    </div>
                    <!-- Close -->
                    <div class="closest__btn action__btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="#344054" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M6 6L18 18" stroke="#344054" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                        <!-- Close -->
                    </div>
                </div>
                <!-- Search Form -->
                <form action="/search" method="post" class="search__form full__width">
                {{ csrf_field() }}
                    <div class="select__style">
                        <select name="filter" class="category-select">
<option value="Tous">Tous</option>
<option value="Kentes">Kentes</option>
<option value="Tissus">Tissus</option>

<option value="Accessoires">Accessoires</option>
                        </select>
                    </div>
                    <input type="search" class="form-control" name="search" placeholder="Recherchez  une couleur ..." />
                    <button type="submit">
                        <img src="/assets-ui/images/search.png" alt="search" />
                    </button>
                </form>
                <!-- Search Form -->
                <div class="flyout__menu">
                    <ul class="flyout-main__menu">
                        <li class="has__dropdown">
                            <a href="/" class="nav__link active">Home</a>
                        </li>
                        <li class="has__dropdown">
                            <a href="/all-categories/tissus" class="nav__link active">Tissus</a>
                            <ul class="sub__menu">
                                <li><a href="/sub-categories/tissus/kentes">Kentes</a></li>
                                
                                                            
                            </ul>
                        </li>
                        <li class="has__dropdown">
                            <a href="/all-categories/coutures" class="nav__link active">Coutures</a>
                            <ul class="sub__menu">
                                <li><a href="/sub-categories/coutures/femmes">Femmes</a></li>
                                <li><a href="/sub-categories/coutures/hommes">Hommes</a></li>                           
                            </ul>
                        </li>
                        <li class="has__dropdown">
                            <a href="/all-categories/accessoires" class="nav__link active">Accessoires</a>
                            <ul class="sub__menu">
                                <li><a href="/sub-categories/accessoires/meches">Mêches</a></li>
                                <li><a href="/sub-categories/accessoires/perruques">Perruques</a></li>
                                <li><a href="/sub-categories/accessoires/éventails">Éventails</a></li>                           
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <!-- Header Flyout Menu End -->


    <!-- Preloader Start -->
    <div id="preloader">
        <div id="status"><img src="/assets-ui/images/favicon.png" alt="logo" /></div>
    </div>
    <!-- Preloader End -->

    <!-- Scroll-top -->
    <button class="scroll-top scroll-to-target" data-target="html">scroll</button>
    <!-- Scroll-top-end-->

    <!-- JS -->
    <script src="/assets-ui/js/jquery-3.6.0.min.js"></script>
    <script src="/assets-ui/js/popper.min.js"></script>
    <script src="/assets-ui/js/bootstrap.min.js"></script>
    <script src="/assets-ui/js/jquery.fancybox.min.js"></script>
    <script src="/assets-ui/js/jquery.plugin.min.js"></script>
    <script src="/assets-ui/js/jquery.countdown.min.js"></script>
    <script src="/assets-ui/js/counterup.min.js"></script>
    <script src="/assets-ui/js/jquery.waypoints.js"></script>
    <script src="/assets-ui/js/jquery.nice-select.js"></script>
    <script src="/assets-ui/js/swiper-bundle.min.js"></script>
    <script src="/assets-ui/js/scripts.js"></script>
</body>

</html>
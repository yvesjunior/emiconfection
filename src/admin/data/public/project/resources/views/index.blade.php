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
    <link rel="shortcut icon" href="assets-ui/images/favicon.png" type="image/f-icon" />

    <!-- font awesome -->
    <link rel="stylesheet" href="assets-ui/css/all.min.css" />
    <!-- bootstraph -->
    <link rel="stylesheet" href="assets-ui/css/bootstrap.min.css" />
    <!-- Fancy Box -->
    <link rel="stylesheet" href="assets-ui/css/jquery.fancybox.min.css" />
    <!-- swiper js -->
    <link rel="stylesheet" href="assets-ui/css/swiper-bundle.min.css" />
    <!-- Nice Select -->
    <link rel="stylesheet" href="assets-ui/css/nice-select.css" />
    <!-- Countdown js -->
    <link rel="stylesheet" href="assets-ui/css/jquery.countdown.css" />
    <!-- User's CSS Here -->
    <link rel="stylesheet" href="assets-ui/css/style.css" />
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
                        <a href="/"><img src="assets-ui/images/logo/logo.png" alt="logo" /> </a>
                    </div>
                    <div class="search__form__wrapper">
                        <form action="/search" method="post" class="search__form">
                        {{ csrf_field() }}
                            <div class="select__style">
                                <select name="filter" class="category-select">
<option value="Tous">Tous</option>
<option value="Kentes">Kentes</option>
<option value="Tissus">Tissus</option>
<option value="Faso Danfani">Faso Danfani</option>
<option value="Accessoires">Accessoires</option>
                                </select>
                            </div>
                            <input type="search" class="form-control" name="search"
                                placeholder="Recherchez  une couleur ..." />
                            <button type="submit">
                                <img src="assets-ui/images/search.png" alt="search" />
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
                                    <img src="assets-ui/images/cart-icon.png" alt="cart-icon" />
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
<option value="Faso Danfani">Faso Danfani</option>
<option value="Accessoires">Accessoires</option>
                    </select>
                </div>
                <input type="search" class="form-control" name="search" placeholder="Recherchez  une couleur ..." />
                <button type="submit">
                    <img src="assets-ui/images/search.png" alt="search" />
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
                            <li class="has__dropdown active">
                                <a href="/">Home</a>
                            </li>
                            <li class="has__dropdown position-static">
                                <a href="#">Tissus</a>
                                <div class="mega__menu sub__menu">
                                    <ul class="mega__menu-item">

                                        <li class="sub-mega__menu">
                                            <a class="menu__title" href="/all-categories/tissus">Tissus</a>
                                            <ul>
                                                <li><a href="/sub-categories/tissus/kentes">Kentes</a></li>
                                                <li><a href="/sub-categories/tissus/fasodanfani">Faso Danfani</a></li>
                                                <li><a href="/sub-categories/tissus/modernes">Modernes</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                            <li class="has__dropdown position-static">
                                <a href="#">Coutures</a>
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
                            <li class="has__dropdown position-static">
                                <a href="#">Accessoires</a>
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
    <!-- Banner Slider v2 End-->
    <section class="banner__slider__section__v2 pb-0">
        <div class="container">
            <div class="row">
                <div class="col-lg-8">
                    <div class="swiper main__mySwiper">
                        <div class="swiper-wrapper">
                            <div class="swiper-slide">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="swiper-slide">
                                            <div class="single__slide__wrapper"
                                                style="background-image: url('assets-ui/images/banner/banner-main-01.png')">
                                                <div class="hero__wrapper text-left hidden">
                                                    <h5 class="hero__subtitle">Limited offer 25% off</h5>
                                                    <h1 class="hero__title">
                                                        Organic Fruit <br />
                                                        For Your Family’s Health
                                                    </h1>
                                                    <p class="hero__content">Save 25% on Papaya Fresh and Ripe</p>
                                                    <div class="hero__btn">
                                                        <a href="product" class="btn btn-primary">Shop Now</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="swiper-slide">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="swiper-slide">
                                            <div class="single__slide__wrapper"
                                                style="background-image: url('assets-ui/images/banner/banner-main-02.png')">
                                                <div class="hero__wrapper text-left">
                                                    <h5 class="hero__subtitle">Limited offer 10% off</h5>
                                                    <h1 class="hero__title">
                                                        Shop wise <br />
                                                        with price <br />
                                                        comparisons
                                                    </h1>
                                                    <p class="hero__content">Save 10% on Screen Fresh and Ripe</p>
                                                    <div class="hero__btn">
                                                        <a href="product" class="btn btn-primary">Shop Now</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="swiper-slide">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="swiper-slide">
                                            <div class="single__slide__wrapper"
                                                style="background-image: url('assets-ui/images/banner/banner-main-03.png')">
                                                <div class="hero__wrapper text-left">
                                                    <h5 class="hero__subtitle">Limited offer 10% off</h5>
                                                    <h1 class="hero__title">
                                                        Summer <br />
                                                        Skin care <br />
                                                        Product
                                                    </h1>
                                                    <p class="hero__content">Save 10% on Screen Fresh and Ripe</p>
                                                    <div class="hero__btn">
                                                        <a href="product" class="btn btn-primary">Shop Now</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="swiper-slide">
                                <div class="row">
                                    <div class="col-12">
                                        <div class="swiper-slide">
                                            <div class="single__slide__wrapper"
                                                style="background-image: url('assets-ui/images/banner/banner-main-04.png')">
                                                <div class="hero__wrapper text-left">
                                                    <h5 class="hero__subtitle">Limited offer 10% off</h5>
                                                    <h1 class="hero__title">
                                                        Summer <br />
                                                        Skin care <br />
                                                        Product
                                                    </h1>
                                                    <p class="hero__content">Save 10% on Screen Fresh and Ripe</p>
                                                    <div class="hero__btn">
                                                        <a href="product" class="btn btn-primary">Shop Now</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="banner__navigation">
                            <div class="swiper-button-next">
                                <svg width="35" height="16" viewBox="0 0 35 16" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
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
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="hero__banner__ads">
                        <div class="banner__ads__wrapper banner__ads__wrapper__v2">
                            <div class="banner__ads__single__item">
                                <span class="banner__ads__subtitle">Soldes mensuel 10%</span>
                                <h5 class="banner__ads__title">
                                    Profitez de nos   <br />
                                    remises
                                </h5>
                                <div class="shop__btn">
                                    <a href="#promotion_index" class="btn btn-primary">Visitez</a>
                                </div>
                            </div>
                            <div class="banner__ads__image">
                                <img src="assets-ui/images/banner-ads/ads-01.png" alt="banner-ads-image" />
                            </div>
                        </div>
                        <div class="banner__ads__wrapper banner__ads__wrapper__v2">
                            <div class="banner__ads__single__item">
                                <span class="banner__ads__subtitle">Pour vos mariages</span>
                                <h5 class="banner__ads__title">
                                    Collections de  
                                    <br />
                                     Pagnes tissés

                                </h5>
                                <div class="shop__btn">
                                    <a href="/sub-categories/tissus/kentes" class="btn btn-primary btn-green">Visitez</a>
                                </div>
                            </div>
                            <div class="banner__ads__image">
                                <img src="assets-ui/images/banner-ads/ads-02.png" alt="banner-ads-image" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Banner Slider v2 End-->

    <!-- Feature Section Start -->
    <section class="feature__section">
        <div class="container">
            <div class="row">
                <div class="col-xl-3 col-lg-6 col-sm-6">
                    <div class="feature__single__item" data-bg="#ECFDF3">
                        <div class="feature__image">
                            <img src="assets-ui/images/feature/feature-01.png" alt="feature-image" />
                        </div>
                        <div class="feature__content">
                            <h4 class="feature__title">Méga Promo</h4>
                            <p>Profitez de nos soldes</p>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-6 col-sm-6">
                    <div class="feature__single__item" data-bg="#FFFAEB">
                        <div class="feature__image">
                            <img src="assets-ui/images/feature/feature-02.png" alt="feature-image" />
                        </div>
                        <div class="feature__content">
                            <h4 class="feature__title">Livraison gratuite</h4>
                            <p>Ville de Ouagadougou</p>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-6 col-sm-6">
                    <div class="feature__single__item" data-bg="#F9F5FF">
                        <div class="feature__image">
                            <img src="assets-ui/images/feature/feature-03.png" alt="feature-image" />
                        </div>
                        <div class="feature__content">
                            <h4 class="feature__title"> Orange money</h4>
                            <p>Envoyez au 55-40-49-95</p>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-lg-6 col-sm-6">
                    <div class="feature__single__item" data-bg="#FEF3F2">
                        <div class="feature__image">
                            <img src="assets-ui/images/feature/feature-04.png" alt="feature-image" />
                        </div>
                        <div class="feature__content">
                            <h4 class="feature__title">Payez par tranche</h4>
                            <p>Sur certains articles</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Feature Section End -->

    <!-- Arrival Section Start -->
    <section class="arrival__section">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <h2>Nouveaux</h2>
                        <!-- <a href="product" class="solid-btn">all <i class="fa-solid fa-angle-right"></i></a> -->
                        <div class="tabs__wrapper">
                            <div class="tabs__filter text-center">
                                <ul class="nav nav-tabs" id="myTab" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="home-tab" data-bs-toggle="tab"
                                            data-bs-target="#home-tab-pane" type="button" role="tab"
                                            aria-controls="home-tab-pane" aria-selected="true">
                                            Tout 
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="kentes-tab" data-bs-toggle="tab"
                                            data-bs-target="#kentes-tab-pane" type="button" role="tab"
                                            aria-controls="kentes-tab-pane" aria-selected="false">
                                            Kentes
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="coutures-tab" data-bs-toggle="tab"
                                            data-bs-target="#coutures-tab-pane" type="button" role="tab"
                                            aria-controls="coutures-tab-pane" aria-selected="false">
                                            Coutures
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="accessoires-tab" data-bs-toggle="tab"
                                            data-bs-target="#accessoires-tab-pane" type="button" role="tab"
                                            aria-controls="accessoires-tab-pane" aria-selected="false">
                                            Accessoires
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="tab-content" id="myTabContent">
                        <!-- ALL -->
                        <div class="tab-pane fade show active" id="home-tab-pane" role="tabpanel"
                            aria-labelledby="home-tab" tabindex="0">
                            <div class="content__body">
                                <div class="product__wrapper swiper__pagination">
                                    <div class="swiper arrival__Swiper">
                                        <div class="swiper-wrapper">
                                        @foreach($newkenteproducts as $product)
                                            <div class="swiper-slide">
                                                <div class="product-card">
                                                    <div class="product__image__wrapper">
                                                        <a href="/product-single/{{$product->id}}" class="product__image">
                                                            <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}"
                                                                alt="icon" />
                                                        </a>
                                                        <!-- <div class="badge">10%</div> -->
                                                        <div class="product__actions">
                                                          
                                                            <a href="/product-single/{{$product->id}}" class="action__btn">
                                                                <svg width="16" height="16" viewBox="0 0 16 16"
                                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                                            <h5><a href="/product-single/{{$product->id}}">{{$product->title}} <br> 
                                                            @foreach(explode(',', $product->tags) as $tag)
                                                            #{{trim($tag)}}
                                                            @endforeach
                                                            </a></h5>
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
                                                    <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="swiper-button-prev">
                                            <svg width="23" height="16" viewBox="0 0 23 16" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 8H1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M8 15L1 8L8 1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                        <div class="swiper-pagination"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Kente -->
                        <div class="tab-pane fade" id="kentes-tab-pane" role="tabpanel"
                            aria-labelledby="kentes-tab" tabindex="0">
                            <div class="content__body">
                                <div class="product__wrapper swiper__pagination">
                                    <div class="swiper arrival__Swiper">
                                        <div class="swiper-wrapper">
                                        @foreach($newkenteproducts as $product)

                                            <div class="swiper-slide">
                                                <div class="product-card">
                                                    <div class="product__image__wrapper">
                                                        <a href="/product-single/{{$product->id}}" class="product__image">
                                                            <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}"
                                                                alt="icon" />
                                                        </a>
                                                        <div class="badge">10%</div>
                                                        <div class="product__actions">
                                                          
                                                            <a href="/product-single/{{$product->id}}" data-bs-toggle="modal"
                                                                data-bs-target="#prod__preview" class="action__btn">
                                                                <svg width="16" height="16" viewBox="0 0 16 16"
                                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                                            <h5><a href="/product-single">{{$product->title}}<br>
                                                            @foreach(explode(',', $product->tags) as $tag)
                                                            #{{trim($tag)}}
                                                            @endforeach
                                                                    </a></h5>
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
                                                    <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="swiper-button-prev">
                                            <svg width="23" height="16" viewBox="0 0 23 16" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 8H1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M8 15L1 8L8 1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                        <div class="swiper-pagination"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Coutures -->
                        <div class="tab-pane fade" id="coutures-tab-pane" role="tabpanel" aria-labelledby="coutures-tab"
                            tabindex="0">
                            <div class="content__body">
                                <div class="product__wrapper swiper__pagination">
                                    <div class="swiper arrival__Swiper">
                                        <div class="swiper-wrapper">
                                        @foreach($newcoutureproducts as $product)
                                            <div class="swiper-slide">
                                                <div class="product-card">
                                                    <div class="product__image__wrapper">
                                                        <a href="/product-single/{{$product->id}}" class="product__image">
                                                            <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}"
                                                                alt="icon" />
                                                        </a>
                                                        <div class="badge">-10%</div>
                                                        <div class="product__actions">
                                                          
                                                            <a href="/product-single/{{$product->id}}" data-bs-toggle="modal"
                                                                data-bs-target="#prod__preview" class="action__btn">
                                                                <svg width="16" height="16" viewBox="0 0 16 16"
                                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                                            <h5><a href="/product-single">{{$product->title}}<br>
                                                            @foreach(explode(',', $product->tags) as $tag)
                                                            #{{trim($tag)}}
                                                            @endforeach
                                                        </a></h5>
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
                                                    <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="swiper-button-prev">
                                            <svg width="23" height="16" viewBox="0 0 23 16" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 8H1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M8 15L1 8L8 1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                        <div class="swiper-pagination"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Accessoire -->
                        <div class="tab-pane fade" id="accessoires-tab-pane" role="tabpanel"
                            aria-labelledby="accessoires-tab" tabindex="0">
                            <div class="content__body">
                                <div class="product__wrapper swiper__pagination">
                                    <div class="swiper arrival__Swiper">
                                        <div class="swiper-wrapper">
                                        @foreach($newaccessoireproducts as $product)
                                            <div class="swiper-slide">
                                                <div class="product-card">
                                                    <div class="product__image__wrapper">
                                                        <a href="/product-single/{{$product->id}}" class="product__image">
                                                            <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}"
                                                                alt="icon" />
                                                        </a>
                                                        <div class="badge">10%</div>
                                                        <div class="product__actions">
                                                          
                                                            <a href="/product-single/{{$product->id}}" data-bs-toggle="modal"
                                                                data-bs-target="#prod__preview" class="action__btn">
                                                                <svg width="16" height="16" viewBox="0 0 16 16"
                                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                                            <h5><a href="/product-single/{{$product->id}}">{{$product->title}}<br>
                                                            @foreach(explode(',', $product->tags) as $tag)
                                                            #{{trim($tag)}}
                                                            @endforeach
                                                        </a></h5>
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
                                                    <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="swiper-button-prev">
                                            <svg width="23" height="16" viewBox="0 0 23 16" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 8H1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M8 15L1 8L8 1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                        <div class="swiper-pagination"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Sale Section End -->

    <!-- Catégorie Section Start -->
    <section class='category__section'>
      <div class='container'>
        <div class='row'>
            <div class='col-12'>
                <div class='section-title'>
                    <h2>Catégories</h2>
                </div>
            </div>
        </div>
        <div class='row'>
            <div class='col-12'>
                <div class='category__wrapper swiper__pagination'>
                    <div class='swiper categorySwiper'>
                        <div class='swiper-wrapper categories_list' id="categories_list">
                        <!-- loop over categories-->
                        @foreach($categories as $cat)
                        <!-- <option value="{{$cat->id}}" selected>{{$cat->name}}</option> -->
                        <div class='swiper-slide'>
                                <a href="/categories/{{$cat->id}}" class='category-card'>
                                    <div class='category-card__image'>
                                    <img src="https://ik.imagekit.io/kiwanoinc/emishops/categories/{{$cat->feature_image}}" alt='icon' />
                                    </div>
                                    <div class='category-card__title'>
                                    <h5>{{$cat->name}}</h5>
                                    </div>
                                </a>
                            </div>            
                        @endforeach
                        <!-- end loop  -->
                        </div>
                        <div class='swiper-slide'>
                            <div class='swiper-button-next'>
                                <svg width='35' height='16' viewBox='0 0 35 16' fill='none'
                                    xmlns='http://www.w3.org/2000/svg'>
                                    <path d='M1 8L34 8' stroke='#D0D5DD' stroke-width='2' stroke-linecap='round'
                                        stroke-linejoin='round' />
                                    <path d='M27 1L34 8L27 15' stroke='#D0D5DD' stroke-width='2'
                                        stroke-linecap='round' stroke-linejoin='round' />
                                </svg>
                            </div>
                        </div>
                        <div class='swiper-button-prev'>
                            <svg width='23' height='16' viewBox='0 0 23 16' fill='none'
                                xmlns='http://www.w3.org/2000/svg'>
                                <path d='M22 8H1' stroke='#D0D5DD' stroke-width='2' stroke-linecap='round'
                                    stroke-linejoin='round' />
                                <path d='M8 15L1 8L8 1' stroke='#D0D5DD' stroke-width='2' stroke-linecap='round'
                                    stroke-linejoin='round' />
                            </svg>
                        </div>
                        <div class='swiper-pagination'></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
    <!-- Catégorie Section End -->

    <!-- Sale Section Start -->
    <section class="sale__section" id="promotion_index">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <div class="section-title__wrap" >
                            <h2>Promotion</h2>
                            <div class="sales__countdown countdown__wrapper">
                                <div id="salesCountdown"></div>
                            </div>
                        </div>
                        <!-- <a href="product" class="solid-btn">all <i class="fa-solid fa-angle-right"></i></a> -->
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="product__wrapper swiper__pagination">
                        <div class="swiper sale__Swiper">
                            <div class="swiper-wrapper">
                                @foreach($discountproducts as $product)
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
                                                <h5><a href="/product-single">{{$product->title}}</a></h5>
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
    <!-- Sale Section End -->

    <!-- Product Feature Section Start -->
    <section class="product__feature__section">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <div class="tabs__wrapper tabs__wrapper__v2">
                            <div class="tabs__filter text-center">
                                <ul class="nav nav-tabs" id="myTab2" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="best-tab" data-bs-toggle="tab"
                                            data-bs-target="#best-tab-pane" type="button" role="tab"
                                            aria-controls="best-tab-pane" aria-selected="true">
                                            Les plus recherchés
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-4">
                    <div class="product-card mb-5 mb-lg-0">
                        <div class="product__image__wrapper product__image__wrapper__v2">
                            <a href="/product-single/{{$mostviewedproduct->id}}" class="product__image">
                                <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$mostviewedproduct->feature_image}}" alt="icon" />
                            </a>
                            <!-- <div class="badge">Save 15%</div> -->
                            <div class="product__actions">

                                <a href="/product-single/{{$mostviewedproduct->id}}" class="action__btn">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M0.666992 7.99996C0.666992 7.99996 3.33366 2.66663 8.00033 2.66663C12.667 2.66663 15.3337 7.99996 15.3337 7.99996C15.3337 7.99996 12.667 13.3333 8.00033 13.3333C3.33366 13.3333 0.666992 7.99996 0.666992 7.99996Z"
                                            stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        <path
                                            d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                                            stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </a>

                            </div>
                        </div>
                        <div class="product__content product__content__v2">

                            <div class="product__title">
                                <h5><a href="#">{{$mostviewedproduct->title}}</a></h5>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="tab-content" id="myTab2Content">
                        <div class="tab-pane fade show active" id="best-tab-pane" role="tabpanel"
                            aria-labelledby="best-tab" tabindex="0">
                            <div class="content__body">
                                <div class="product__wrapper swiper__pagination">
                                    <div class="swiper feature__prod__Swiper">
                                        <div class="swiper-wrapper">
                                        @foreach($mostviewedproducts as $product)
                                            <div class="swiper-slide">
                                                <div class="product-card">
                                                    <div class="product__image__wrapper">
                                                        <a href="/product-single/{{$product->id}}" class="product__image">
                                                            <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}"
                                                                alt="icon" />
                                                        </a>
                                                        <!-- <div class="badge">10%</div> -->
                                                        <div class="product__actions">
                                                          
                                                            <a href="#" data-bs-toggle="modal"
                                                                data-bs-target="#prod__preview" class="action__btn">
                                                                <svg width="16" height="16" viewBox="0 0 16 16"
                                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                                    <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="swiper-button-prev">
                                            <svg width="23" height="16" viewBox="0 0 23 16" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 8H1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M8 15L1 8L8 1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                        <div class="swiper-pagination"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="weekly-tab-pane" role="tabpanel" aria-labelledby="weekly-tab"
                            tabindex="0">
                            <div class="content__body">
                                <div class="product__wrapper swiper__pagination">
                                    <div class="swiper feature__prod__Swiper">
                                        <div class="swiper-wrapper">
                                            @foreach($mostviewedproducts as $product)
                                            <div class="swiper-slide">
                                                <div class="product-card">
                                                    <div class="product__image__wrapper">
                                                        <a href="product-single/{{$product->id}}" class="product__image">
                                                            <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}"
                                                                alt="icon" />
                                                        </a>
                                                        <div class="badge">5%</div>
                                                        <div class="product__actions">
                                                          
                                                            <a href="#" data-bs-toggle="modal"
                                                                data-bs-target="#prod__preview" class="action__btn">
                                                                <svg width="16" height="16" viewBox="0 0 16 16"
                                                                    fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                                    <path d="M1 8L34 8" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M27 1L34 8L27 15" stroke="#D0D5DD" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="swiper-button-prev">
                                            <svg width="23" height="16" viewBox="0 0 23 16" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 8H1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M8 15L1 8L8 1" stroke="#D0D5DD" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                        <div class="swiper-pagination"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Product Feature Section End -->

    <!-- CAll To Action Start -->
    <section class="call__to__action">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="cta__box__wrapper text-center">
                        <h2 class="cta__title">Contactez-nous</h2>
                        <a href="https://web.facebook.com/nitiemae" target="_blank"><button class="btn btn-primary"><i class="fa-brands fa-facebook"></i></button></a>
                        <a href="//api.whatsapp.com/send?phone=22661004593&text=Bonjour, je suis interessé par vos articles" target="_blank"><button class="btn btn-primary"><i class="fa-brands fa-whatsapp"></i></button></a>
                        <a href="mailto:nitiemaemilie2@gmail.com"target="_blank"><button class="btn btn-primary"><i class="fa-solid fa-envelope"></i></button></a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- CAll To Action End -->

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
                                <a href="https://web.facebook.com/nitiemae" target="_blank" ><i class="fa-brands fa-facebook"></i></a>
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
                        <a href="/"><img src="assets-ui/images/logo/logo.png" alt="logo" /></a>
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
                        <option value="Faso Danfani">Faso Danfani</option>
                        <option value="Accessoires">Accessoires</option>
                        </select>
                    </div>
                    <input type="search" class="form-control" name="search" placeholder="Recherchez  une couleur ..." />
                    <button type="submit">
                        <img src="assets-ui/images/search.png" alt="search" />
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
                                <li><a href="/sub-categories/tissus/fasodanfani">Faso Danfani</a></li>
                                <li><a href="/sub-categories/tissus/modernes">Modernes</a></li>                            
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
        <div id="status"><img src="assets-ui/images/favicon.png" alt="logo" /></div>
    </div>
    <!-- Preloader End -->

    <!-- Scroll-top -->
    <button class="scroll-top scroll-to-target" data-target="html">scroll</button>
    <!-- Scroll-top-end-->

    <!-- JS -->
    <script src="assets-ui/js/jquery-3.6.0.min.js"></script>
    <script src="assets-ui/js/popper.min.js"></script>
    <script src="assets-ui/js/bootstrap.min.js"></script>
    <script src="assets-ui/js/jquery.fancybox.min.js"></script>
    <script src="assets-ui/js/jquery.plugin.min.js"></script>
    <script src="assets-ui/js/jquery.countdown.min.js"></script>
    <script src="assets-ui/js/counterup.min.js"></script>
    <script src="assets-ui/js/jquery.waypoints.js"></script>
    <script src="assets-ui/js/jquery.nice-select.js"></script>
    <script src="assets-ui/js/swiper-bundle.min.js"></script>
    <script src="assets-ui/js/scripts.js"></script>
</body>

</html>
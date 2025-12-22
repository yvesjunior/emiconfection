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
                                    <option value="1">Kentes</option>
                                    <option value="2">Tissus</option>
                                    <option value="3">Faso Danfani</option>
                                    <option value="4">Accessoires</option>
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

    <!-- All Category Section Start -->
    <section class="archive-category">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="section-title">
                        <h2></h2>
                        <!-- <a href="product" class="solid-btn">all <i class="fa-solid fa-angle-right"></i></a> -->
                        <div class="shortBy-select select__style">
                            <label for="sortBy">Trier:</label>
                            <select name="sortBy" id="sortBy">
                                <option value="0">Pertinence</option>
                                <option value="0">Nom (A-Z)</option>
                                <option value="0">Nom (Z-A)</option>
                                
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row archive-category__inner">
                <div class="category-sidebar accordion" id="categorySidebar">
                    <div class="category-sidebar__inner">
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="headingOne">
                                <button class="accordion-button" type="button" data-bs-toggle="collapse"
                                    data-bs-target="#Groceries" aria-expanded="true"
                                    aria-controls="Groceries">{{$subcategory->name}}</button>
                            </h2>                        </div>
             
                    </div>
                </div>

                <div class="product-card__wrapper">
                    @foreach($products as $product)
                    <div class="product-card">
                        <div class="product__image__wrapper">
                            <a href="/product-single/{{$product->id}}" class="product__image">
                                <img src="https://ik.imagekit.io/kiwanoinc/emishops/products/tr:l-text,i-emishops,fs-85,co-FFFFFF,l-end/{{$product->feature_image}}" alt="icon" />
                            </a>
                            <!-- <div class="badge">10%</div> -->
                            <div class="product__actions">

                                <a href="/product-single/{{$product->id}}" class="action__btn">
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
                        <div class="product__content">

                            <div class="product__title">
                                <h5><a href="product-single">{{$product->title}}</a></h5>
                            </div>

                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
    </section>
    <!-- All Category Section End -->

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
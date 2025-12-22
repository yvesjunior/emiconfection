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
                                <span class="title">cart</span>
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

    <!-- All Category Section Start -->
    <section class="archive-category">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-12">
                    <div class="section-title mb-30">
                        <h2>Products</h2>
                        <div class="shortBy-select select__style d-lg-none d-flex">
                            <label for="sortBy">Trier:</label>
                            <select name="sortBy" id="sortBy">
                                <option value="0">Pertinence</option>
                                <option value="0">Nom (A-Z)</option>
                                <option value="0">Nom (Z-A)</option>
                                
                            </select>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="filter__area">
                        <div class="section-title__wrap">
                            <form action="#" class="product-filter">
                                <div class="custom__dropdown custom__dropdown__v2">
                                    <div class="selected">
                                        <div class="selected_item selected_item-v2">Price</div>
                                    </div>
                                    <ul class="list list__v2">
                                        <li>$100.00 - $200.00</li>
                                        <li>$100.00 - $200.00</li>
                                        <li>$100.00 - $200.00</li>
                                        <li>$100.00 - $200.00</li>
                                        <li>$100.00 - $200.00</li>
                                    </ul>
                                </div>
                                <div class="custom__dropdown custom__dropdown__v2">
                                    <div class="selected">
                                        <div class="selected_item selected_item-v2">Color</div>
                                    </div>
                                    <ul class="list list__v2">
                                        <li><span class="color" data-bg="red"></span>Red</li>
                                        <li><span class="color" data-bg="blue"></span>Blue</li>
                                        <li><span class="color" data-bg="yellow"></span>Yellow</li>
                                        <li><span class="color" data-bg="black"></span>Black</li>
                                        <li><span class="color" data-bg="green"></span>green</li>
                                    </ul>
                                </div>
                                <div class="custom__dropdown custom__dropdown__v2">
                                    <div class="selected">
                                        <div class="selected_item selected_item-v2">Brand</div>
                                    </div>
                                    <ul class="list list__v2">
                                        <li>Groceries</li>
                                        <li>Electronics</li>
                                        <li>Women</li>
                                        <li>Men</li>
                                        <li>Sports</li>
                                    </ul>
                                </div>
                                <div class="custom__dropdown custom__dropdown__v2">
                                    <div class="selected">
                                        <div class="selected_item selected_item-v2">warranty Type</div>
                                    </div>
                                    <ul class="list list__v2">
                                        <li>1 year warranty</li>
                                        <li>2 year warranty</li>
                                        <li>3 year warranty</li>
                                        <li>4 year warranty</li>
                                        <li>5 year warranty</li>
                                    </ul>
                                </div>
                                <div class="custom__dropdown custom__dropdown__v2">
                                    <div class="selected">
                                        <div class="selected_item selected_item-v2">rating</div>
                                    </div>
                                    <ul class="list list__v2">
                                        <li>
                                            <div class="rating rating__v2">
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                            </div>
                                        </li>
                                        <li>
                                            <div class="rating rating__v2">
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                            </div>
                                        </li>
                                        <li>
                                            <div class="rating rating__v2">
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                            </div>
                                        </li>
                                        <li>
                                            <div class="rating rating__v2">
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-regular fa-star"></i></a>
                                            </div>
                                        </li>
                                        <li>
                                            <div class="rating rating__v2">
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                                <a href="#"><i class="fa-solid fa-star"></i></a>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div class="custom__dropdown custom__dropdown__v2">
                                    <div class="selected">
                                        <div class="selected_item selected_item-v2">availability</div>
                                    </div>
                                    <ul class="list list__v2">
                                        <li>10 Days</li>
                                        <li>20 Days</li>
                                        <li>30 Days</li>
                                        <li>40 Days</li>
                                        <li>50 Days</li>
                                    </ul>
                                </div>
                                <div class="custom__dropdown custom__dropdown__v2">
                                    <div class="selected">
                                        <div class="selected_item selected_item-v2">delivery Speed</div>
                                    </div>
                                    <ul class="list list__v2">
                                        <li>Fast</li>
                                        <li>Slow</li>
                                        <li>Emergency</li>
                                    </ul>
                                </div>
                            </form>
                            <ul class="filtered-query">
                                <li>
                                    <span class="value">CareVe</span>
                                    <a href="#" class="action">&times;</a>
                                </li>
                                <li>
                                    <span class="color" data-bg="red"></span>
                                    <span class="value">Red</span>
                                    <a href="#" class="action">&times;</a>
                                </li>
                                <li>
                                    <span class="color" data-bg="green"></span>
                                    <span class="value">green</span>
                                    <a href="#" class="action">&times;</a>
                                </li>
                                <li>
                                    <span class="value">In-stock</span>
                                    <a href="#" class="action">&times;</a>
                                </li>
                                <li>
                                    <span class="value">Rating: 5 & Up</span>
                                    <a href="#" class="action">&times;</a>
                                </li>
                                <li>
                                    <span class="value">2 Days</span>
                                    <a href="#" class="action">&times;</a>
                                </li>
                                <li class="clearAll"><a href="#">Clear all</a></li>
                            </ul>
                        </div>

                        <div class="shortBy-select select__style d-lg-flex d-none">
                            <label for="sortBy2">Trier:</label>
                            <select name="sortBy" id="sortBy2">
                                <option value="0">Pertinence</option>
                                <option value="0">Nom (A-Z)</option>
                                <option value="0">Nom (Z-A)</option>
                                
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div class="product-card__wrapper items-1-5">
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-01.png" alt="icon" />
                                </a>
                                <div class="badge">10%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-03.png" alt="icon" />
                                </a>
                                <div class="badge">20%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-04.png" alt="icon" />
                                </a>
                                <div class="badge">-10%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-05.png" alt="icon" />
                                </a>
                                <div class="badge">30%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-06.png" alt="icon" />
                                </a>
                                <div class="badge">18%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-07.png" alt="icon" />
                                </a>
                                <div class="badge">5%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-08.png" alt="icon" />
                                </a>
                                <div class="badge">10%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-09.png" alt="icon" />
                                </a>
                                <div class="badge">-12%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-10.png" alt="icon" />
                                </a>
                                <div class="badge">10%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-11.png" alt="icon" />
                                </a>
                                <div class="badge">10%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-12.png" alt="icon" />
                                </a>
                                <div class="badge">20%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-13.png" alt="icon" />
                                </a>
                                <div class="badge">10%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-14.png" alt="icon" />
                                </a>
                                <div class="badge">25%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-15.png" alt="icon" />
                                </a>
                                <div class="badge">10%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="product-card">
                            <div class="product__image__wrapper">
                                <a href="product-single" class="product__image">
                                    <img src="assets-ui/images/products/prod-16.png" alt="icon" />
                                </a>
                                <div class="badge">15%</div>
                                <div class="product__actions">
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M13.8931 2.07333C13.5526 1.73267 13.1483 1.46243 12.7033 1.27805C12.2584 1.09368 11.7814 0.998779 11.2998 0.998779C10.8181 0.998779 10.3412 1.09368 9.89618 1.27805C9.45121 1.46243 9.04692 1.73267 8.70642 2.07333L7.99975 2.78L7.29309 2.07333C6.60529 1.38553 5.67244 0.999136 4.69975 0.999136C3.72706 0.999136 2.79422 1.38553 2.10642 2.07333C1.41863 2.76112 1.03223 3.69397 1.03223 4.66666C1.03223 5.63935 1.41863 6.5722 2.10642 7.26L2.81309 7.96666L7.99975 13.1533L13.1864 7.96666L13.8931 7.26C14.2337 6.91949 14.504 6.51521 14.6884 6.07023C14.8727 5.62526 14.9676 5.14832 14.9676 4.66666C14.9676 4.185 14.8727 3.70807 14.6884 3.26309C14.504 2.81812 14.2337 2.41383 13.8931 2.07333V2.07333Z"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                    <a href="#" class="action__btn">
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
                                    <a href="#" class="action__btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 9.33329L13.3333 5.99996L10 2.66663" stroke="#252522"
                                                stroke-linecap="round" stroke-linejoin="round" />
                                            <path
                                                d="M2.66699 13.3333V8.66667C2.66699 7.95942 2.94794 7.28115 3.44804 6.78105C3.94814 6.28095 4.62641 6 5.33366 6H13.3337"
                                                stroke="#252522" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="product__content">
                                <div class="product__rating">
                                    <ul>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-solid fa-star"></i></li>
                                        <li><i class="fa-regular fa-star"></i></li>
                                    </ul>
                                    <div class="total__rating">(321)</div>
                                </div>
                                <div class="product__title">
                                    <h5><a href="product-single">Tootsie Frooties- Taffy Candy - Bulk Fruit Chews -
                                            Fruity Roll Fruity Roll</a></h5>
                                </div>
                                <div class="product__bottom">
                                    <div class="product__price">
                                        $22.00
                                        <del>$22.00</del>
                                    </div>
                                    <div class="cart__action__btn">
                                        <div class="cart__btn">
                                            <a href="#" class="btn btn-outline">Add to cart</a>
                                        </div>
                                        <div class="quantity cart__quantity">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <!-- pagination start  -->
                    <nav class="pagination__wrapper">
                        <ul class="pagination">
                            <li class="pagination__item">
                                <a class="page-link" href="#"><i class="fa-solid fa-angle-left"></i></a>
                            </li>
                            <li class="pagination__item active"><a class="page-link" href="#">1</a></li>
                            <li class="pagination__item"><a class="page-link" href="#">2</a></li>
                            <li class="pagination__item"><a class="page-link" href="#">3</a></li>
                            <li class="pagination__item"><a class="page-link dot" href="#">...</a></li>
                            <li class="pagination__item"><a class="page-link" href="#">8</a></li>
                            <li class="pagination__item"><a class="page-link" href="#">9</a></li>
                            <li class="pagination__item"><a class="page-link" href="#">10</a></li>
                            <li class="pagination__item">
                                <a class="page-link" href="#"><i class="fa-solid fa-angle-right"></i></a>
                            </li>
                        </ul>
                        <div class="pagination__jump">
                            <label class="junp__label" for="pageNumber">Go to Page</label>
                            <input type="number" name="page" id="pageNumber" class="jump__input" placeholder="02" />
                            <button class="btn btn-outline jump__btn" type="submit">GO <i
                                    class="fa-solid fa-arrow-right"></i></button>
                        </div>
                    </nav>
                    <!-- pagination end -->
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
                        </form>
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
                            <a href="#" class="nav__link active">Tissus</a>
                            <ul class="sub__menu">
                                <li><a href="all-categories">Kente</a></li>
                                <li><a href="sub-categories/tissus/fasodanfani">Faso Danfani</a></li>
                                <li><a href="all-categories">Modern</a></li>                            
                            </ul>
                        </li>
                        <li class="has__dropdown">
                            <a href="#" class="nav__link active">Coutures</a>
                            <ul class="sub__menu">
                                <li><a href="all-categories">Femmes</a></li>
                                <li><a href="all-categories">Hommes</a></li>                           
                            </ul>
                        </li>
                        <li class="has__dropdown">
                            <a href="#" class="nav__link active">Accessoires</a>
                            <ul class="sub__menu">
                                <li><a href="all-categories">Mêches</a></li>
                                <li><a href="all-categories">Pérruques</a></li>
                                <li><a href="all-categories">Éventails</a></li>                           
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <!-- Header Flyout Menu End -->

    <!-- Header FlyoutCart Start -->
    <div class="flyoutCart">
        <div class="flyout__flip">
            <div class="flyout__inner">
                <div class="cart__header-top">
                    <div class="main__title">Your Cart</div>
                    <div class="close__btn action__btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="#344054" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                            <path d="M6 6L18 18" stroke="#344054" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                        <!-- Close -->
                    </div>
                </div>
                <div class="cart__title">
                    <h3>Product</h3>
                    <h3>Price</h3>
                </div>
                <div class="cart__items">
                    <!-- Shopping Cart Item Start -->
                    <div class="shopping-card">
                        <a href="#" class="shopping-card__image">
                            <img src="assets-ui/images/cart/cart-01.png" alt="cart-product" />
                        </a>
                        <div class="shopping-card__content">
                            <div class="shopping-card__content-top">
                                <h5 class="product__title">
                                    <a href="#">All Natural Italian Chicken Meatballs</a>
                                </h5>
                                <h5 class="product__price">$24.40</h5>
                            </div>
                            <div class="shopping-card__content-bottom">
                                <div class="quantity__wrapper">
                                    <div class="quantity">
                                        <button type="button" class="decressQnt">
                                            <span class="bar"></span>
                                        </button>
                                        <input class="qnttinput" type="number" disabled value="0" min="01" max="100" />
                                        <button type="button" class="incressQnt">
                                            <span class="bar"></span>
                                        </button>
                                    </div>
                                    <div class="stock__item">In Stock</div>
                                </div>
                                <button type="button" class="action__btn">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1.25 3.5H2.75M2.75 3.5H14.75M2.75 3.5V14C2.75 14.3978 2.90804 14.7794 3.18934 15.0607C3.47064 15.342 3.85218 15.5 4.25 15.5H11.75C12.1478 15.5 12.5294 15.342 12.8107 15.0607C13.092 14.7794 13.25 14.3978 13.25 14V3.5H2.75ZM5 3.5V2C5 1.60218 5.15804 1.22064 5.43934 0.93934C5.72064 0.658035 6.10218 0.5 6.5 0.5H9.5C9.89782 0.5 10.2794 0.658035 10.5607 0.93934C10.842 1.22064 11 1.60218 11 2V3.5M6.5 7.25V11.75M9.5 7.25V11.75"
                                            stroke="#667085" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- Shopping Cart Item Start -->
                    <div class="shopping-card">
                        <a href="#" class="shopping-card__image">
                            <img src="assets-ui/images/cart/cart-02.png" alt="cart-product" />
                        </a>
                        <div class="shopping-card__content">
                            <div class="shopping-card__content-top">
                                <h5 class="product__title">
                                    <a href="#">All Natural Italian Chicken Meatballs</a>
                                </h5>
                                <h5 class="product__price">$24.40</h5>
                            </div>
                            <div class="shopping-card__content-bottom">
                                <div class="quantity__wrapper">
                                    <div class="quantity">
                                        <button type="button" class="decressQnt">
                                            <span class="bar"></span>
                                        </button>
                                        <input class="qnttinput" type="number" disabled value="0" min="01" max="100" />
                                        <button type="button" class="incressQnt">
                                            <span class="bar"></span>
                                        </button>
                                    </div>
                                    <div class="stock__item text-danger">Out Of Stock</div>
                                </div>
                                <button type="button" class="action__btn">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1.25 3.5H2.75M2.75 3.5H14.75M2.75 3.5V14C2.75 14.3978 2.90804 14.7794 3.18934 15.0607C3.47064 15.342 3.85218 15.5 4.25 15.5H11.75C12.1478 15.5 12.5294 15.342 12.8107 15.0607C13.092 14.7794 13.25 14.3978 13.25 14V3.5H2.75ZM5 3.5V2C5 1.60218 5.15804 1.22064 5.43934 0.93934C5.72064 0.658035 6.10218 0.5 6.5 0.5H9.5C9.89782 0.5 10.2794 0.658035 10.5607 0.93934C10.842 1.22064 11 1.60218 11 2V3.5M6.5 7.25V11.75M9.5 7.25V11.75"
                                            stroke="#667085" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- Shopping Cart Item Start -->
                    <div class="shopping-card">
                        <a href="#" class="shopping-card__image">
                            <img src="assets-ui/images/cart/cart-03.png" alt="cart-product" />
                        </a>
                        <div class="shopping-card__content">
                            <div class="shopping-card__content-top">
                                <h5 class="product__title">
                                    <a href="#">All Natural Italian Chicken Meatballs</a>
                                </h5>
                                <h5 class="product__price">$24.40</h5>
                            </div>
                            <div class="shopping-card__content-bottom">
                                <div class="quantity__wrapper">
                                    <div class="quantity">
                                        <button type="button" class="decressQnt">
                                            <span class="bar"></span>
                                        </button>
                                        <input class="qnttinput" type="number" disabled value="0" min="01" max="100" />
                                        <button type="button" class="incressQnt">
                                            <span class="bar"></span>
                                        </button>
                                    </div>
                                    <div class="stock__item">In Stock</div>
                                </div>
                                <button type="button" class="action__btn">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1.25 3.5H2.75M2.75 3.5H14.75M2.75 3.5V14C2.75 14.3978 2.90804 14.7794 3.18934 15.0607C3.47064 15.342 3.85218 15.5 4.25 15.5H11.75C12.1478 15.5 12.5294 15.342 12.8107 15.0607C13.092 14.7794 13.25 14.3978 13.25 14V3.5H2.75ZM5 3.5V2C5 1.60218 5.15804 1.22064 5.43934 0.93934C5.72064 0.658035 6.10218 0.5 6.5 0.5H9.5C9.89782 0.5 10.2794 0.658035 10.5607 0.93934C10.842 1.22064 11 1.60218 11 2V3.5M6.5 7.25V11.75M9.5 7.25V11.75"
                                            stroke="#667085" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- Shopping Cart Item Start -->
                    <div class="shopping-card">
                        <a href="#" class="shopping-card__image">
                            <img src="assets-ui/images/cart/cart-04.png" alt="cart-product" />
                        </a>
                        <div class="shopping-card__content">
                            <div class="shopping-card__content-top">
                                <h5 class="product__title">
                                    <a href="#">All Natural Italian Chicken Meatballs</a>
                                </h5>
                                <h5 class="product__price">$24.40</h5>
                            </div>
                            <div class="shopping-card__content-bottom">
                                <div class="quantity__wrapper">
                                    <div class="quantity">
                                        <button type="button" class="decressQnt">
                                            <span class="bar"></span>
                                        </button>
                                        <input class="qnttinput" type="number" disabled value="0" min="01" max="100" />
                                        <button type="button" class="incressQnt">
                                            <span class="bar"></span>
                                        </button>
                                    </div>
                                    <div class="stock__item text-danger">Out Of Stock</div>
                                </div>
                                <button type="button" class="action__btn">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1.25 3.5H2.75M2.75 3.5H14.75M2.75 3.5V14C2.75 14.3978 2.90804 14.7794 3.18934 15.0607C3.47064 15.342 3.85218 15.5 4.25 15.5H11.75C12.1478 15.5 12.5294 15.342 12.8107 15.0607C13.092 14.7794 13.25 14.3978 13.25 14V3.5H2.75ZM5 3.5V2C5 1.60218 5.15804 1.22064 5.43934 0.93934C5.72064 0.658035 6.10218 0.5 6.5 0.5H9.5C9.89782 0.5 10.2794 0.658035 10.5607 0.93934C10.842 1.22064 11 1.60218 11 2V3.5M6.5 7.25V11.75M9.5 7.25V11.75"
                                            stroke="#667085" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- Shopping Cart Item End -->
                </div>
                <!-- Cart Items End -->
                <!-- Cart SubTotal Start -->
                <ul class="cart__subtotal">
                    <li>
                        <span class="label">Subtotal</span>
                        <span class="value">$45.00</span>
                    </li>
                    <li>
                        <span class="label">Shipping:</span>
                        <span class="value">$15.22</span>
                    </li>
                </ul>
                <!-- Cart SubTotal End -->
                <!-- Total Start -->
                <div class="cart__total">
                    <h3>Total <span>(Incl. VAT)</span></h3>
                    <div class="total">$60.22</div>
                </div>
                <!-- Total End -->
            </div>
            <!-- Cart Button Start -->
            <div class="cart__btns">
                <a href="checkout" class="btn btn-primary">Go To Checkout</a>
                <a href="#" class="btn btn-outline">Continue shopping</a>
            </div>
            <!-- Cart Button End -->
        </div>
    </div>
    <!-- Header FlyoutCart End -->



    <!-- Product Preview Modal Start -->
    <div class="modal fade product__modal" id="prod__preview" aria-hidden="true" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="container">
                        <div class="row product-detail align-items-center">
                            <div class="col-md-6 col-sm-8 m-auto">
                                <div class="product-gallery product-gallery__v2">
                                    <div class="product-gallery__main swiper productPreviewSwiper">
                                        <div class="swiper-wrapper">
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-01.png" alt="product iamge" />
                                                </div>
                                            </div>
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-02.png" alt="product iamge" />
                                                </div>
                                            </div>
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-03.png" alt="product iamge" />
                                                </div>
                                            </div>
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-04.png" alt="product iamge" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="product-gallery__thumb swiper productPreviewSwiperThumb">
                                        <div class="swiper-wrapper">
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-01.png" alt="product iamge" />
                                                </div>
                                            </div>
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-02.png" alt="product iamge" />
                                                </div>
                                            </div>
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-03.png" alt="product iamge" />
                                                </div>
                                            </div>
                                            <div class="swiper-slide">
                                                <div class="gallery-item">
                                                    <img src="assets-ui/images/products/prod-04.png" alt="product iamge" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="product-detail__wrapper product-detail__wrapper-v2">
                                    <h2 class="product-detail__title">EB 18 Large Cage Free White A Egg</h2>
                                    <div class="product-detail__meta">
                                        <div class="rating">
                                            <ul>
                                                <li><i class="fa-solid fa-star"></i></li>
                                                <li><i class="fa-solid fa-star"></i></li>
                                                <li><i class="fa-solid fa-star"></i></li>
                                                <li><i class="fa-regular fa-star"></i></li>
                                                <li><i class="fa-regular fa-star"></i></li>
                                            </ul>
                                            <div class="total__rating">
                                                <a href="#">(3,822 ratings)</a>
                                            </div>
                                        </div>
                                        <ul class="right-meta">
                                            <li>
                                                <div class="stock__item">In-stock</div>
                                            </li>
                                        </ul>
                                    </div>
                                    <h3 class="product-detail__price">$15.00</h3>
                                    <p class="product-detail__short_desc">
                                        There are many variations of passages of Lorem Ipsum and available,majority have
                                        suffered alteration in somey form, by injected humour, or randomised words which
                                        don't look
                                        even slightly believable.
                                    </p>
                                    <div class="product-detail__attr">
                                        <div class="product__attr">
                                            <span class="product-detail--stroke">Filter By Color</span>
                                            <ul class="product__attr--color">
                                                <li>
                                                    <input type="radio" name="filterByColor" id="colorGreen"
                                                        value="green" />
                                                    <label for="colorGreen" data-bg="#12B76A"></label>
                                                </li>

                                                <li>
                                                    <input type="radio" name="filterByColor" id="colorYellow"
                                                        value="yellow" />
                                                    <label for="colorYellow" data-bg="#F1C584"></label>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div class="product-detail__attr">
                                        <div class="product__attr">
                                            <span class="product-detail--stroke">Size</span>
                                            <ul class="product__attr--size">
                                                <li>
                                                    <input type="radio" name="filterBySize" id="sizeXXL" value="xxl" />
                                                    <label for="sizeXXL">XXL</label>
                                                </li>
                                                <li>
                                                    <input type="radio" name="filterBySize" id="sizeXL" value="xl" />
                                                    <label for="sizeXL">XL</label>
                                                </li>
                                                <li>
                                                    <input type="radio" name="filterBySize" id="sizeL" value="l" />
                                                    <label for="sizeL">L</label>
                                                </li>
                                                <li>
                                                    <input type="radio" name="filterBySize" id="sizeM" value="m" />
                                                    <label for="sizeM">M</label>
                                                </li>
                                                <li>
                                                    <input type="radio" name="filterBySize" id="sizeS" value="s" />
                                                    <label for="sizeS">S</label>
                                                </li>
                                                <li>
                                                    <input type="radio" name="filterBySize" id="sizeXS" value="xs" />
                                                    <label for="sizeXS">XS</label>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div class="product-detail__qty">
                                        <span class="product-detail--stroke">quantity</span>
                                        <div class="quantity quantity--outline">
                                            <button type="button" class="decressQnt">
                                                <span class="bar"></span>
                                            </button>
                                            <input class="qnttinput" type="number" disabled value="0" min="01"
                                                max="100" />
                                            <button type="button" class="incressQnt">
                                                <span class="bar"></span>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="product-detail__action">
                                        <a href="product-single" class="btn btn-primary btn-outline w-100">Add to
                                            Cart</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Product Preview Modal End -->

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
# Shizuku Coffee
![macOS](https://img.shields.io/badge/platform-macOS%20%7C%20Safari-blue)

![Status](https://img.shields.io/badge/status-maintained%20and%20developing-brightgreen)

> A frontend e-commerce simulation inspired by Japanese cafés, cozy aesthetics and modern web interactions.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Platform](https://img.shields.io/badge/platform-Web-blue)
![JavaScript](https://img.shields.io/badge/Vanilla-JavaScript-yellow)

## About

Shizuku Coffee is a frontend-focused e-commerce simulation created as a portfolio and educational project. The goal of the project is not to build a production-ready online store, but to demonstrate modern frontend development, UI/UX design, state management and interactive user experiences using Vanilla JavaScript.

The project recreates the experience of browsing a premium coffee shop inspired by Japanese cafés while remaining completely fictional.

Every product, transaction, payment and order exists only inside the application and is simulated locally.

---

## Important Notice

This project **does not sell real products**.

The following systems are simulations created solely for demonstration purposes:

* shopping cart
* checkout
* payments
* orders
* invoices
* loyalty points
* gift cards
* shipping
* transaction history

No real payment gateway is connected.

No personal or financial information is processed.

All data is stored locally inside the browser (LocalStorage) unless otherwise specified.

---

# Features

## Product Catalog

Users can browse a complete coffee catalog including:

* specialty coffees
* accessories
* gift cards
* product images
* ratings
* reviews
* detailed product information

Each product contains its own metadata such as origin, roast level, tasting notes and price.

---

## Shopping Cart

The cart system supports:

* adding and removing products
* quantity management
* subtotal calculation
* shipping calculation
* persistent cart using LocalStorage

---

## Checkout Simulation

The checkout flow simulates a complete purchasing experience including:

* shipping information
* payment method selection
* order confirmation
* receipt generation
* order history

No real payment is processed.

---

# Miko — AI Shopping Assistant

One of the core features of the project is **Miko**, an integrated shopping assistant designed specifically for the Shizuku Coffee experience.

Unlike a simple chatbot, Miko is aware of the products available in the store and is capable of assisting users throughout their shopping journey.

Miko can:

* recommend coffees based on customer preferences
* explain roast levels
* compare products
* answer questions about flavor profiles
* recommend coffees based on origin
* suggest products according to budget
* remember parts of the current conversation
* guide users through the catalog
* help discover new coffees

To make conversations feel more natural, Miko maintains lightweight conversation memory inside the browser, allowing follow-up questions without constantly repeating context.

The assistant is intended to improve the overall shopping experience while remaining fully client-side.

---

# Loyalty Program

Shizuku Coffee includes a complete loyalty system.

Customers earn loyalty points through simulated purchases and progress through several membership tiers.

Current tiers:

| Tier    | Required Lifetime Points | Benefits                                                          |
| ------- | -----------------------: | ----------------------------------------------------------------- |
| Sprout  |                        0 | Welcome tier                                                      |
| Blossom |                      500 | Seasonal coffee bonuses                                           |
| Petal   |                     1500 | Accessory discounts and priority support                          |
| Sakura  |                     5000 | VIP benefits including coffee discounts and free express shipping |

Lifetime points determine the membership tier.

Redeeming points for rewards **does not reduce the customer's tier**, since progression is based on lifetime points earned rather than the current balance.

---

# User Account

The profile system includes features such as:

* editable profile
* saved addresses
* loyalty information
* order history
* purchase statistics
* transaction history
* rewards overview

All account information is simulated and stored locally.

---

# Gift Cards

Users can purchase fictional gift cards in multiple values.

Gift cards function entirely inside the simulated store environment and cannot be redeemed outside of the application.

---

# Reviews & Ratings

Products support customer reviews and ratings, allowing users to simulate a realistic shopping environment.

These reviews exist only within the application.

---

# Localization

The project contains multilingual elements, including English and Japanese-inspired interface components that reinforce the café atmosphere.

---

# Technologies

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)
* Bootstrap 5
* LocalStorage
* Express (lightweight backend for AI integration)

---

# Design Goals

The project focuses on:

* clean UI
* responsive layout
* smooth user interactions
* immersive shopping experience
* reusable JavaScript components
* realistic e-commerce workflows

Rather than emphasizing backend infrastructure, the project demonstrates how a rich shopping experience can be built almost entirely on the frontend.

---

# Disclaimer

Shizuku Coffee is a fictional project created for educational and portfolio purposes.

The application is **not affiliated with any real coffee company or retailer.**

Products, prices, customers, transactions, payments, gift cards, loyalty points and purchase history are entirely fictional and exist only inside the application.

No real purchases can be made through this project.

---

# Future Improvements

Some planned improvements include:

* enhanced AI conversations
* better recommendation engine
* additional coffee collections
* improved accessibility
* more account customization
* expanded loyalty rewards
* animations and micro-interactions
* optional backend synchronization

---

## Author

Created as a portfolio project demonstrating modern frontend development, UI/UX design and interactive web application architecture.

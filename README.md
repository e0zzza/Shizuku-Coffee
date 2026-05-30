# Shizuku Coffee

![Status](https://img.shields.io/badge/status-maintained%20and%20developing-brightgreen)

Shizuku Coffee is a frontend-only e-commerce simulation inspired by Japanese cafés, seasonal aesthetics, and cozy online storefronts. The project is built with Vanilla JavaScript and Bootstrap 5, focusing on atmosphere and interaction rather than real commerce.

It includes features like the Miko AI assistant, loyalty tiers, localization, and persistent browser storage while running entirely on the client side without any backend.

> This is a simulation project.  
> Products are not actually sold and no real transactions happen.

---

## Features

- Seasonal Japanese-inspired design
- Miko AI assistant
- Simulated shopping cart and checkout flow
- Loyalty rank system
- IP-based localization
- Persistent data using LocalStorage
- Responsive Bootstrap 5 layout
- Fully frontend / zero-backend architecture

---

## Built With

- Vanilla JavaScript
- Bootstrap 5
- HTML5 / CSS3
- LocalStorage API

---

## How Data Is Stored

Shizuku Coffee does not use a database or backend server.

Everything is stored locally in the browser using `LocalStorage`. 
This includes things like:

- cart contents
- loyalty progress
- user preferences
- selected region/currency
- simulated order history

Because of this:

- data stays on the user's device
- nothing is uploaded to a server
- clearing browser storage resets the site data
- each browser/device has separate saved data

---

## Are The Products Real?

No. Shizuku Coffee is only a simulated storefront made for frontend development practice and design experimentation.

The shopping experience is designed to feel real, but:

* products cannot actually be purchased
* payments are not processed
* orders are not created
* nothing is shipped

The goal of the project is to recreate the feel of a modern online coffee shop while staying fully client-side.

---

## Miko AI Assistant

Miko is the built-in assistant that helps make the storefront feel more interactive and alive.

Depending on the implementation, Miko can:

* recommend products
* react to loyalty tiers
* guide users around the site
* display seasonal dialogue
* Miko is still developing - she may occasionally provide incorrect information or misunderstand complex requests

Miko also runs entirely on the frontend.

---

## Localization

The site uses approximate IP-based localization to personalize parts of the experience.

This may affect things like:

* greetings
* currency symbols
* featured products
* language presentation

Localization is only used for immersion and presentation purposes.

---

## Performance

Since there is no backend or database, the project stays lightweight and fast.

---

## Purpose

Shizuku Coffee was created as a learning project focused on:

* frontend architecture
* UI/UX design
* browser storage systems
* e-commerce simulation
* responsive layouts
* lightweight JavaScript applications

---

## Disclaimer

Shizuku Coffee is a fictional storefront and educational project.

No real commercial transactions take place through this application.

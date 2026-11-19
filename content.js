/* =========================================================
   content.js — ALL editable business & product content.
   Edit names, descriptions, prices and image paths here.
   ========================================================= */

const BUSINESS = {
  name: "Grand Orchid Hotel",
  tagline: "Book your stay, order room service & enjoy our services",
  currency: "RM",
  phone: "+60 5-123 4567",
  address: "Ipoh, Perak, Malaysia",
};

/* Categories — `id` is referenced by products below. */
const CATEGORIES = [
  { id: "rooms",  name: "Rooms" },
  { id: "dining", name: "Dining" },
  { id: "spa",    name: "Spa & Wellness" },
  { id: "extras", name: "Extras" },
];

/* Products — replace `image` paths with your own photos later
   (e.g. "images/deluxe-room.jpg"). Prices are numbers. */
const PRODUCTS = [
  // Rooms (price per night)
  { id: "room-standard", category: "rooms", name: "Standard Room",
    description: "Cosy queen-bed room with city view. Per night.",
    price: 180, image: "images/room-standard.svg" },
  { id: "room-deluxe", category: "rooms", name: "Deluxe Room",
    description: "Spacious king-bed room with balcony. Per night.",
    price: 280, image: "images/room-deluxe.svg" },
  { id: "room-family", category: "rooms", name: "Family Suite",
    description: "Two bedrooms and a living area, sleeps 4. Per night.",
    price: 420, image: "images/room-family.svg" },
  { id: "room-presidential", category: "rooms", name: "Presidential Suite",
    description: "Top-floor suite with lounge and private dining. Per night.",
    price: 950, image: "images/room-presidential.svg" },

  // Dining
  { id: "dine-breakfast", category: "dining", name: "Breakfast Buffet",
    description: "Local and international breakfast spread, per person.",
    price: 45, image: "images/dine-breakfast.svg" },
  { id: "dine-nasi", category: "dining", name: "Nasi Lemak Set",
    description: "Coconut rice, sambal, fried chicken, egg and peanuts.",
    price: 22, image: "images/dine-nasi.svg" },
  { id: "dine-club", category: "dining", name: "Club Sandwich",
    description: "Triple-decker with chicken, egg and fries.",
    price: 28, image: "images/dine-club.svg" },
  { id: "dine-ipoh-hor-fun", category: "dining", name: "Ipoh Hor Fun",
    description: "Silky flat noodles in prawn and chicken broth.",
    price: 20, image: "images/dine-horfun.svg" },

  // Spa & Wellness
  { id: "spa-massage", category: "spa", name: "Traditional Massage (60 min)",
    description: "Full-body massage to relax tired muscles.",
    price: 150, image: "images/spa-massage.svg" },
  { id: "spa-facial", category: "spa", name: "Signature Facial",
    description: "Deep-cleansing, hydrating facial treatment.",
    price: 130, image: "images/spa-facial.svg" },
  { id: "spa-pool", category: "spa", name: "Pool & Gym Day Pass",
    description: "Full-day access to the pool and fitness centre.",
    price: 35, image: "images/spa-pool.svg" },

  // Extras
  { id: "extra-airport", category: "extras", name: "Airport Transfer",
    description: "One-way private car between the airport and the hotel.",
    price: 90, image: "images/extra-airport.svg" },
  { id: "extra-laundry", category: "extras", name: "Laundry Service",
    description: "Wash and fold, returned within 24 hours. Per bag.",
    price: 30, image: "images/extra-laundry.svg" },
  { id: "extra-latecheckout", category: "extras", name: "Late Check-out (until 4 PM)",
    description: "Keep your room a few extra hours.",
    price: 60, image: "images/extra-latecheckout.svg" },
];

/* Checkout options */
const ORDER_TYPES = ["Room Booking", "Room Service (deliver to room)", "Restaurant / Pick-up", "Spa & Services"];
const PAYMENT_METHODS = ["Pay at Hotel", "Credit / Debit Card", "Online Banking", "E-Wallet"];

/* Payment method that skips online payment at checkout (guest pays at the front desk). */
const PAY_AT_HOTEL = "Pay at Hotel";

/* Order status flow (shared by customer tracking and the staff page).
   `key` is stored on the order; `label` is what customers and staff see;
   `stage` is the staff board column the status belongs to.

   Online payment:  [customer pays] → Pending Confirmation → Paid (staff confirms) → Checked In → Checked Out
   Pay at Hotel:    Pending Confirmation → Confirmed – Pay at Hotel → Paid → Checked In → Checked Out
   Rejected/cancelled: → Cancelled → Refunded (refund only if the guest already paid) */
const ORDER_STATUSES = [
  { key: "NEW",          label: "Pending Confirmation",      stage: "NEW" },
  { key: "PAY_AT_HOTEL", label: "Confirmed – Pay at Hotel",  stage: "PAY_AT_HOTEL" },
  { key: "PAID",         label: "Paid",                      stage: "PAID" },
  { key: "CHECKED_IN",   label: "Checked In",                stage: "CHECKED_IN" },
  { key: "CHECKED_OUT",  label: "Checked Out",               stage: "CHECKED_OUT" },
  { key: "CANCELLED",    label: "Cancelled",                 stage: "CANCELLED" },
  { key: "REFUNDED",     label: "Refunded",                  stage: "CANCELLED" },
];

/* Staff order board columns (left to right). */
const BOARD_STAGES = [
  { key: "NEW",          label: "Pending Confirmation" },
  { key: "PAY_AT_HOTEL", label: "Pay at Hotel (Unpaid)" },
  { key: "PAID",         label: "Paid" },
  { key: "CHECKED_IN",   label: "Checked In" },
  { key: "CHECKED_OUT",  label: "Checked Out" },
  { key: "CANCELLED",    label: "Cancelled / Refunded" },
];

/* Workshop/demo staff PIN — NOT real security. Replace with a proper login before going live. */
const STAFF_PIN = "1234";

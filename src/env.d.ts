/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Nonce CSP par requête, injecté par le middleware. À poser sur tout <script> inline. */
    cspNonce?: string;
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Penjaga lapis pertama untuk /admin.
 *
 * Ini hanya pencegah supaya halaman admin tidak sempat dirender untuk yang
 * tidak berhak. Penjaga sebenarnya ada di setiap server action lewat
 * `requireAdmin()` — middleware saja tidak pernah cukup.
 */
const RUTE_TERJAGA = ["/admin", "/ultraproduktif"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (RUTE_TERJAGA.some((r) => pathname.startsWith(r)) && !req.auth?.user?.isAdmin) {
    const url = new URL("/masuk", req.nextUrl.origin);
    url.searchParams.set("tujuan", pathname);
    url.searchParams.set("galat", req.auth?.user ? "bukan-admin" : "perlu-masuk");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/ultraproduktif/:path*"],
};

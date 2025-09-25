import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Github, Twitter, Linkedin } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-card text-card-foreground py-16 border-t">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Marketplace</h3>
            <p className="text-muted-foreground mb-4">
              Connecting buyers and sellers in a trusted community marketplace.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Github className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Linkedin className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Buyers</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  to="/all-items"
                  className="hover:text-foreground transition-colors"
                >
                  Browse Items
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="hover:text-foreground transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-foreground transition-colors"
                >
                  Advanced Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Sellers</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  to="/create-item"
                  className="hover:text-foreground transition-colors"
                >
                  List Item
                </Link>
              </li>
              <li>
                <Link
                  to="/seller-guide"
                  className="hover:text-foreground transition-colors"
                >
                  Seller Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-foreground transition-colors"
                >
                  Pricing Tips
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link
                  to="/help"
                  className="hover:text-foreground transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/safety"
                  className="hover:text-foreground transition-colors"
                >
                  Safety Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground">
            © 2024 Marketplace. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground text-sm">
              Secure & Trusted Platform
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

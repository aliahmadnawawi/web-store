package main

import (
  "encoding/xml"
  "os"
)

type Rss struct {
  XMLName xml.Name `xml:"rss"`
  Version string `xml:"version,attr"`
  G string `xml:"xmlns:g,attr"`
  Channel Channel `xml:"channel"`
}

type Channel struct {
  Title string `xml:"title"`
  Link string `xml:"link"`
  Description string `xml:"description"`
  Items []Item `xml:"item"`
}

type Item struct {
  ID string `xml:"g:id"`
  Title string `xml:"g:title"`
  Description string `xml:"g:description"`
  Link string `xml:"g:link"`
  Image string `xml:"g:image_link"`
  Availability string `xml:"g:availability"`
  Price string `xml:"g:price"`
  IdentifierExists string `xml:"g:identifier_exists"`
}

func main() {
  feed := Rss{
    Version: "2.0",
    G: "http://base.google.com/ns/1.0",
    Channel: Channel{
      Title: "Sebelas Indonesia Product Feed",
      Link: "https://sebelasindonesia.com",
      Description: "Auto feed for Google Merchant Center",
      Items: []Item{{
        ID: "netflix-1",
        Title: "Netflix Premium 1 Bulan",
        Description: "Akun premium legal dengan auto-delivery.",
        Link: "https://sebelasindonesia.com/product/netflix-1-bulan",
        Image: "https://sebelasindonesia.com/images/netflix-premium.jpg",
        Availability: "in stock",
        Price: "39000 IDR",
        IdentifierExists: "false",
      }},
    },
  }

  enc := xml.NewEncoder(os.Stdout)
  enc.Indent("", "  ")
  _ = enc.Encode(feed)
}

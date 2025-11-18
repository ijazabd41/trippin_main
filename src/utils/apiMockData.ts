// Mock data for API fallbacks when services are unavailable
export interface MockDataResponse {
  success: boolean;
  data: any;
  isMockData: boolean;
  message: string;
}

// OpenAI Chat Mock Data
export const mockChatResponse = (): MockDataResponse => ({
  success: true,
  data: {
    response: "申し訳ございませんが、現在AIサービスが利用できません。こちらは事前に準備された回答です。日本旅行について基本的な情報をお手伝いできます。"
  },
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。"
});

// OpenAI Vision Mock Data
export const mockVisionResponse = (): MockDataResponse => ({
  success: true,
  data: {
    translation: "画像翻訳サービスが現在利用できません。インターネット接続を確認してください。"
  },
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。"
});

// OpenAI Generate Mock Data
export const mockGenerateResponse = (): MockDataResponse => {
  const plans = [
    {
      theme: "文化・歴史重視プラン",
      description: "伝統的な寺院と歴史的建造物を中心とした文化体験",
      destination: "東京",
      duration: "3日間",
      totalEstimatedCost: "¥85,000",
      itinerary: [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          title: "東京到着・浅草文化探索",
          activities: [
            {
              id: "cultural_act_1",
              time: "10:00",
              name: "羽田空港到着",
              location: "羽田空港",
              coordinates: { lat: 35.5494, lng: 139.7798 },
              type: "transport",
              description: "東京への玄関口、国際線ターミナル",
              estimatedCost: "0 JPY",
              duration: "30",
              rating: 4.0,
              tips: "到着後、京急線で浅草方面へ向かいます。ICカードの購入をお忘れなく。"
            },
            {
              id: "cultural_transport_1",
              time: "10:30",
              name: "羽田空港 → 浅草駅",
              location: "京急線・都営浅草線",
              coordinates: { lat: 35.7101, lng: 139.7956 },
              type: "transport",
              description: "京急線・都営浅草線で浅草駅まで約45分の電車移動",
              estimatedCost: "410 JPY",
              duration: "45",
              rating: 4.2,
              tips: "ICカード（Suica/PASMO）が便利です。乗り換えは1回です。",
              transportDetails: {
                method: "電車",
                line: "京急線→都営浅草線",
                transfers: 1,
                walkingTime: "5分"
              }
            },
            {
              id: "cultural_act_2",
              time: "11:30",
              name: "浅草寺参拝",
              location: "浅草",
              coordinates: { lat: 35.7148, lng: 139.7967 },
              type: "culture",
              description: "645年創建の東京最古の寺院。雷門（風雷神門）は浅草のシンボルで、高さ3.9m、重さ700kgの大提灯が有名。本堂では観音様に参拝し、おみくじを引くことができます。",
              estimatedCost: "0 JPY",
              duration: "90",
              rating: 4.8,
              tips: "雷門での記念撮影は必須！本堂でのお参りは二礼二拍手一礼で。おみくじは日本語・英語対応です。",
              reviews: [
                {
                  rating: 5,
                  text: "雷門の迫力に圧倒されました。本堂での参拝は心が洗われる思いでした。",
                  author: "文化愛好家"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      theme: "グルメ・食べ歩きプラン",
      description: "東京の美味しいグルメを中心とした食文化体験",
      destination: "東京",
      duration: "3日間", 
      totalEstimatedCost: "¥95,000",
      itinerary: [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          title: "東京到着・築地グルメ探索",
          activities: [
            {
              id: "gourmet_act_1",
              time: "10:00",
              name: "羽田空港到着",
              location: "羽田空港",
              coordinates: { lat: 35.5494, lng: 139.7798 },
              type: "transport",
              description: "東京への玄関口",
              estimatedCost: "0 JPY",
              duration: "30",
              rating: 4.0,
              tips: "到着後、東京モノレールで新橋経由築地方面へ。"
            },
            {
              id: "gourmet_act_2",
              time: "11:30",
              name: "築地場外市場",
              location: "築地",
              coordinates: { lat: 35.6654, lng: 139.7707 },
              type: "food",
              description: "新鮮な海鮮とグルメの聖地。マグロの解体ショーや職人の技を間近で見学できます。",
              estimatedCost: "3500 JPY",
              duration: "120",
              rating: 4.7,
              tips: "朝早い時間（6:00-9:00）が最も活気があります。玉子焼きの「山長」は必食！"
            }
          ]
        }
      ]
    },
    {
      theme: "現代カルチャー・エンタメプラン", 
      description: "最新の日本ポップカルチャーとエンターテイメント体験",
      destination: "東京",
      duration: "3日間",
      totalEstimatedCost: "¥78,000",
      itinerary: [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          title: "東京到着・秋葉原アニメ文化",
          activities: [
            {
              id: "anime_act_1",
              time: "10:00",
              name: "羽田空港到着",
              location: "羽田空港",
              coordinates: { lat: 35.5494, lng: 139.7798 },
              type: "transport",
              description: "東京への玄関口",
              estimatedCost: "0 JPY",
              duration: "30",
              rating: 4.0,
              tips: "到着後、京急線で秋葉原方面へ。"
            },
            {
              id: "anime_act_2",
              time: "11:30",
              name: "秋葉原電気街",
              location: "秋葉原",
              coordinates: { lat: 35.7022, lng: 139.7744 },
              type: "shopping",
              description: "世界最大の電気街。アニメ、マンガ、ゲーム、フィギュアなどオタク文化の聖地。",
              estimatedCost: "5000 JPY",
              duration: "150",
              rating: 4.6,
              tips: "ヨドバシカメラ、ビックカメラで最新ガジェット。メイドカフェ体験も！"
            }
          ]
        }
      ]
    }
  ];

  return {
    success: true,
    data: {
      plans,
      itinerary: [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          title: "東京到着・浅草探索",
          activities: [
            {
              id: "act_1",
              time: "10:00",
              name: "羽田空港到着",
              location: "羽田空港",
              coordinates: { lat: 35.5494, lng: 139.7798 },
              type: "transport",
              description: "東京への玄関口",
              estimatedCost: "0 JPY",
              duration: "30",
              rating: 4.0,
              tips: "到着後、京急線で浅草方面へ向かいます。"
            },
            {
              id: "act_1_transport",
              time: "10:30",
              name: "羽田空港 → 浅草駅",
              location: "京急線・都営浅草線",
              coordinates: { lat: 35.7101, lng: 139.7956 },
              type: "transport",
              description: "京急線・都営浅草線で浅草駅まで約45分の電車移動",
              estimatedCost: "410 JPY",
              duration: "45",
              rating: 4.2,
              tips: "IC カード（Suica/PASMO）が便利です。乗り換えは1回です。",
              transportDetails: {
                method: "電車",
                line: "京急線→都営浅草線",
                transfers: 1,
                walkingTime: "5分"
              }
            },
            {
              id: "act_2", 
              time: "11:30",
              name: "浅草寺参拝",
              location: "浅草",
              coordinates: { lat: 35.7148, lng: 139.7967 },
              type: "culture",
              description: "645年創建の東京最古の寺院。雷門（風雷神門）は浅草のシンボルで、高さ3.9m、重さ700kgの大提灯が有名。本堂では観音様に参拝し、おみくじを引くことができます。",
              estimatedCost: "0 JPY",
              duration: "90",
              rating: 4.8,
              tips: "雷門での記念撮影は必須！本堂でのお参りは二礼二拍手一礼で。おみくじは日本語・英語対応です。",
              reviews: [
                {
                  rating: 5,
                  text: "雷門の迫力に圧倒されました。本堂での参拝は心が洗われる思いでした。",
                  author: "文化愛好家"
                }
              ]
            },
            {
              id: "act_2_lunch",
              time: "13:00",
              name: "浅草今半（昼食）",
              location: "浅草",
              coordinates: { lat: 35.7142, lng: 139.7965 },
              type: "food",
              description: "明治28年創業の老舗すき焼き店。最高級の黒毛和牛を使った絶品すき焼きで、浅草の伝統の味を堪能できます。ランチセットは比較的リーズナブル。",
              estimatedCost: "3,500 JPY",
              duration: "60",
              rating: 4.7,
              tips: "ランチの「すき焼き御膳」がおすすめ。夜より手頃な価格で本格的な味を楽しめます。",
              reviews: [
                {
                  rating: 5,
                  text: "お肉が口の中でとろけました。老舗の格式と味に感動！",
                  author: "グルメ探検家"
                }
              ]
            },
            {
              id: "act_3",
              time: "14:00", 
              name: "仲見世通り散策",
              location: "浅草",
              coordinates: { lat: 35.7148, lng: 139.7967 },
              type: "shopping",
              description: "江戸時代から続く日本最古の商店街（約250m）。89店舗が軒を連ね、人形焼き、雷おこし、扇子、手ぬぐいなど伝統的な和雑貨とグルメが楽しめます。",
              estimatedCost: "2,500 JPY",
              duration: "120",
              rating: 4.6,
              tips: "人形焼きは「木村家本店」、雷おこしは「常盤堂」が老舗。食べ歩きしながら宝蔵門まで歩きましょう。",
              reviews: [
                {
                  rating: 4,
                  text: "人形焼きの出来立てが最高！お土産選びも楽しかったです。",
                  author: "お土産ハンター"
                }
              ]
            },
            {
              id: "act_4",
              time: "16:30",
              name: "隅田川クルーズ",
              location: "浅草",
              coordinates: { lat: 35.7101, lng: 139.8107 },
              type: "sightseeing", 
              description: "浅草〜お台場間の水上バス。隅田川から見る東京スカイツリー（634m）、レインボーブリッジ、12の歴史的な橋梁を水上から眺める40分の船旅。",
              estimatedCost: "1040 JPY",
              duration: "40",
              rating: 4.7,
              tips: "右側の席がおすすめ！東京スカイツリーがよく見えます。船内アナウンスは日英対応。",
              reviews: [
                {
                  rating: 5,
                  text: "水上から見る東京は別世界！スカイツリーの迫力に感動しました。",
                  author: "クルーズ愛好家"
                }
              ]
            },
            {
              id: "act_4_transport",
              time: "17:30",
              name: "お台場 → 浅草駅",
              location: "ゆりかもめ・都営浅草線",
              coordinates: { lat: 35.7101, lng: 139.7956 },
              type: "transport",
              description: "ゆりかもめ新橋駅経由で浅草駅まで約35分の電車移動",
              estimatedCost: "320 JPY",
              duration: "35",
              rating: 4.1,
              tips: "ゆりかもめは無人運転で景色が良く見えます。",
              transportDetails: {
                method: "電車",
                line: "ゆりかもめ→JR山手線→都営浅草線",
                transfers: 2,
                walkingTime: "8分"
              }
            },
            {
              id: "act_5",
              time: "18:30",
              name: "老舗天ぷら「大黒家」（夕食）",
              location: "浅草",
              coordinates: { lat: 35.7145, lng: 139.7962 },
              type: "food",
              description: "1887年創業、137年の歴史を誇る江戸前天ぷらの老舗。4代目が守り続ける伝統の技法で、車海老、穴子、野菜の天ぷらを胡麻油でカラッと揚げます。",
              estimatedCost: "4500 JPY", 
              duration: "90",
              rating: 4.8,
              tips: "カウンター席で職人の技を間近で！海老天（1,200円）と穴子天（1,000円）は絶対注文。天つゆは甘めの江戸前スタイル。",
              reviews: [
                {
                  rating: 5,
                  text: "137年の伝統を感じる本格的な江戸前天ぷら。職人さんの技術に感動しました。",
                  author: "天ぷら愛好家"
                }
              ]
            }
          ]
        },
        {
          day: 2,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          title: "渋谷・原宿カルチャー体験",
          activities: [
            {
              id: "act_6",
              time: "09:00",
              name: "明治神宮参拝",
              location: "原宿",
              coordinates: { lat: 35.6763, lng: 139.6993 },
              type: "culture",
              description: "1920年創建、明治天皇と昭憲皇太后を祀る神社。70万㎡の人工林「明治神宮の森」に囲まれ、都心とは思えない静寂な空間。年間参拝者数は日本一の約1000万人。",
              estimatedCost: "0 JPY",
              duration: "90",
              rating: 4.9,
              tips: "南参道（原宿駅側）から入るのが一般的。大鳥居は木造では日本一の大きさ。御朱印は500円です。",
              reviews: [
                {
                  rating: 5,
                  text: "都心にこんな静寂な森があるとは！心が洗われる神聖な体験でした。",
                  author: "スピリチュアル探求者"
                }
              ]
            },
            {
              id: "act_6_transport",
              time: "10:45",
              name: "明治神宮前 → 竹下通り",
              location: "徒歩移動",
              coordinates: { lat: 35.6702, lng: 139.7016 },
              type: "transport",
              description: "明治神宮前駅から竹下通り入口まで徒歩3分の短距離移動",
              estimatedCost: "0 JPY",
              duration: "3",
              rating: 4.0,
              tips: "JR原宿駅の竹下口が最寄りです。",
              transportDetails: {
                method: "徒歩",
                distance: "200m",
                walkingTime: "3分"
              }
            },
            {
              id: "act_7",
              time: "11:00",
              name: "竹下通り散策",
              location: "原宿",
              coordinates: { lat: 35.6702, lng: 139.7016 },
              type: "shopping",
              description: "全長350mの日本ポップカルチャーの聖地。原宿系ファッション、キャラクターグッズ、クレープ店など約400店舗が密集。週末は歩行者天国になります。",
              estimatedCost: "3,500 JPY",
              duration: "120",
              rating: 4.5,
              tips: "「マリオンクレープ」の原宿クレープ（500円）は必食！「DAISO原宿店」は100円ショップの聖地です。",
              reviews: [
                {
                  rating: 4,
                  text: "カラフルで楽しい！クレープが美味しくて、若者の文化を感じられました。",
                  author: "ポップカルチャーファン"
                }
              ]
            },
            {
              id: "act_7_lunch",
              time: "13:00",
              name: "bills 表参道（昼食）",
              location: "表参道",
              coordinates: { lat: 35.6657, lng: 139.7085 },
              type: "food",
              description: "シドニー発祥の「世界一の朝食」で有名なカフェレストラン。ふわふわのリコッタパンケーキとオーガニック食材を使った料理が自慢。",
              estimatedCost: "2,800 JPY",
              duration: "60",
              rating: 4.6,
              tips: "名物のリコッタパンケーキ（1,400円）は絶対注文！平日ランチは比較的空いています。",
              reviews: [
                {
                  rating: 5,
                  text: "パンケーキがふわふわで感動！オーストラリアの味を東京で楽しめました。",
                  author: "パンケーキ愛好家"
                }
              ]
            },
            {
              id: "act_7_transport",
              time: "14:15",
              name: "表参道 → 表参道ヒルズ",
              location: "徒歩移動",
              coordinates: { lat: 35.6657, lng: 139.7085 },
              type: "transport",
              description: "表参道駅から表参道ヒルズまで徒歩2分の短距離移動",
              estimatedCost: "0 JPY",
              duration: "2",
              rating: 4.0,
              tips: "表参道の美しいケヤキ並木を楽しみながら歩けます。",
              transportDetails: {
                method: "徒歩",
                distance: "150m",
                walkingTime: "2分"
              }
            },
            {
              id: "act_8",
              time: "14:00",
              name: "表参道ヒルズ",
              location: "表参道",
              coordinates: { lat: 35.6657, lng: 139.7085 },
              type: "shopping",
              description: "建築家・安藤忠雄設計の螺旋スロープが美しいショッピング施設。地下3階〜地上3階に約100店舗。同潤会青山アパートの歴史を受け継ぐ文化的建築物。",
              estimatedCost: "6,000 JPY",
              duration: "120", 
              rating: 4.6,
              tips: "螺旋スロープは建築美の傑作！屋上テラス「スペース オー」からの表参道ケヤキ並木の眺めは絶景です。",
              reviews: [
                {
                  rating: 5,
                  text: "安藤忠雄の建築美に感動！ショッピングしながら芸術作品の中を歩いている気分。",
                  author: "建築愛好家"
                }
              ]
            },
            {
              id: "act_8_transport",
              time: "16:45",
              name: "表参道 → 渋谷",
              location: "JR山手線",
              coordinates: { lat: 35.6581, lng: 139.7016 },
              type: "transport",
              description: "JR山手線で表参道から渋谷まで約7分の電車移動",
              estimatedCost: "160 JPY",
              duration: "7",
              rating: 4.3,
              tips: "山手線は2-4分間隔で運行。ラッシュ時間を避けているので比較的空いています。",
              transportDetails: {
                method: "電車",
                line: "JR山手線",
                transfers: 0,
                walkingTime: "3分"
              }
            },
            {
              id: "act_9",
              time: "16:30", 
              name: "渋谷スカイ展望台",
              location: "渋谷",
              coordinates: { lat: 35.6581, lng: 139.7016 },
              type: "sightseeing",
              description: "渋谷スカイビル屋上の360度パノラマ展望台（地上230m）。世界最大級のスクランブル交差点を上から見下ろし、晴天時は富士山、東京スカイツリーまで一望。",
              estimatedCost: "2000 JPY",
              duration: "60",
              rating: 4.7,
              tips: "夕日タイム（17:00-18:30）がベスト！スクランブル交差点の人の流れは圧巻。写真撮影スポット多数。",
              reviews: [
                {
                  rating: 5,
                  text: "スクランブル交差点を上から見る体験は唯一無二！夕日と東京の夜景が最高でした。",
                  author: "絶景ハンター"
                }
              ]
            },
            {
              id: "act_9_dinner",
              time: "19:00",
              name: "渋谷「鳥貴族」（夕食）",
              location: "渋谷",
              coordinates: { lat: 35.6598, lng: 139.7006 },
              type: "food",
              description: "全品298円（税抜）の焼き鳥居酒屋チェーン。新鮮な国産鶏を使った焼き鳥と豊富なドリンクメニューで、日本の居酒屋文化を気軽に体験できます。",
              estimatedCost: "2,500 JPY",
              duration: "90",
              rating: 4.4,
              tips: "「もも貴族焼」と「つくね」は定番！乾杯は「カンパイ！」で。ハイボールが人気です。",
              reviews: [
                {
                  rating: 4,
                  text: "リーズナブルで美味しい！地元の人たちと一緒に楽しい時間を過ごせました。",
                  author: "居酒屋探検家"
                }
              ]
            }
          ]
        }
      ]
    },
    isMockData: true,
    message: "通信に失敗したため、モックデータを表示しています。"
  };
};

// TripAdvisor Mock Data
export const mockTripAdvisorResponse = (): MockDataResponse => ({
  success: true,
  data: [
    {
      name: "浅草寺",
      description: "645年創建の東京最古の寺院。雷門、仲見世通り、本堂など見どころ満載。年間約3000万人が訪れる東京屈指の観光名所です。",
      rating: "4.5",
      num_reviews: "15,000+",
      photo: {
        images: {
          original: {
            url: "https://images.pexels.com/photos/161251/senso-ji-temple-asakusa-tokyo-japan-161251.jpeg"
          }
        }
      },
      web_url: "https://www.tripadvisor.com/Attraction_Review-g1066451-d320046-Reviews-Senso_ji_Temple-Taito_Tokyo_Tokyo_Prefecture_Kanto.html"
    },
    {
      name: "明治神宮",
      description: "明治天皇と昭憲皇太后を祀る神社。都心にありながら70万平方メートルの深い森に囲まれた神聖な空間です。",
      rating: "4.9",
      num_reviews: "12,000+",
      photo: {
        images: {
          original: {
            url: "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg"
          }
        }
      },
      web_url: "https://www.tripadvisor.com/Attraction_Review-g1066456-d320047-Reviews-Meiji_Shrine-Shibuya_Tokyo_Tokyo_Prefecture_Kanto.html"
    }
  ],
  reviews: {
    data: [
      {
        title: "早朝参拝が最高でした",
        text: "朝6時に訪れましたが、観光客も少なく静寂な雰囲気の中で参拝できました。雷門から本堂までの道のりで日本の歴史を感じることができます。",
        rating: 5,
        user: { username: "TokyoMorningWalker" }
      },
      {
        title: "仲見世通りのグルメが最高",
        text: "人形焼きと雷おこしを食べ歩きしました。どちらも出来立てで美味しく、お土産にも最適です。外国人観光客にも優しいお店が多いです。",
        rating: 4,
        user: { username: "FoodieExplorer" }
      },
      {
        title: "夜のライトアップも美しい",
        text: "昼間とは違った幻想的な雰囲気を楽しめます。五重塔のライトアップは特に印象的でした。",
        rating: 5,
        user: { username: "NightPhotographer" }
      }
    ]
  },
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。"
});

// Google Maps Mock Data
export const mockGoogleMapsResponse = (): MockDataResponse => ({
  success: true,
  data: [
    {
      id: "place_1",
      name: "浅草寺",
      nameEn: "Senso-ji Temple",
      category: "temple",
      rating: 4.8,
      distance: "0.5km",
      address: "東京都台東区浅草2-3-1",
      phone: "03-3842-0181",
      hours: "6:00-17:00",
      description: "東京最古の寺院",
      image: "https://images.pexels.com/photos/161251/senso-ji-temple-asakusa-tokyo-japan-161251.jpeg"
    },
    {
      id: "place_2",
      name: "東京スカイツリー",
      nameEn: "Tokyo Skytree", 
      category: "landmark",
      rating: 4.7,
      distance: "1.2km",
      address: "東京都墨田区押上1-1-2",
      phone: "0570-55-0634",
      hours: "8:00-22:00",
      description: "世界一高い電波塔",
      image: "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg"
    }
  ],
  predictions: [
    {
      structured_formatting: { main_text: "浅草寺" },
      description: "東京都台東区浅草2-3-1, 日本",
      place_id: "mock_asakusa_temple",
      types: ["place_of_worship", "tourist_attraction"]
    },
    {
      structured_formatting: { main_text: "東京スカイツリー" },
      description: "東京都墨田区押上1-1-2, 日本", 
      place_id: "mock_tokyo_skytree",
      types: ["tourist_attraction", "point_of_interest"]
    }
  ],
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。"
});

// eSIM Mock Data
export const mockESIMResponse = (): MockDataResponse => ({
  success: true,
  data: [
    {
      id: "esim_plan_1",
      name: "Japan 3GB - 15 Days",
      description: "日本全国で使える15日間3GBプラン",
      dataAmount: "3GB",
      validity: "15日",
      price: { amount: 3500, currency: "JPY" },
      coverage: "日本全国",
      network: "NTT Docomo"
    },
    {
      id: "esim_plan_2", 
      name: "Japan 10GB - 30 Days",
      description: "日本全国で使える30日間10GBプラン",
      dataAmount: "10GB",
      validity: "30日",
      price: { amount: 8500, currency: "JPY" },
      coverage: "日本全国",
      network: "NTT Docomo"
    },
    {
      id: "esim_plan_3",
      name: "Japan 1GB - 7 Days", 
      description: "短期滞在向け7日間1GBプラン",
      dataAmount: "1GB",
      validity: "7日",
      price: { amount: 1500, currency: "JPY" },
      coverage: "日本全国",
      network: "SoftBank"
    }
  ],
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。"
});

// Amadeus Mock Data
export const mockAmadeusResponse = (): MockDataResponse => ({
  success: true,
  data: {
    flights: [
      {
        id: "flight_1",
        airline: "JAL",
        flightNumber: "JL123",
        departure: {
          airport: "NRT",
          city: "Tokyo",
          time: "09:30"
        },
        arrival: {
          airport: "KIX", 
          city: "Osaka",
          time: "11:00"
        },
        price: { amount: 15000, currency: "JPY" },
        duration: "1h 30m"
      }
    ],
    hotels: [
      {
        id: "hotel_1",
        name: "グランドホテル東京",
        location: "東京駅周辺",
        rating: 4.5,
        price: { amount: 25000, currency: "JPY" },
        amenities: ["WiFi", "朝食", "温泉", "ジム"]
      }
    ]
  },
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。"
});

// Currency Convert Mock Data
export const mockCurrencyResponse = (): MockDataResponse => ({
  success: true,
  data: {
    rates: {
      "USD": 0.0067,
      "EUR": 0.0063,
      "GBP": 0.0054,
      "CNY": 0.048,
      "KRW": 9.2,
      "THB": 0.23
    },
    base: "JPY",
    date: new Date().toISOString().split('T')[0]
  },
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。"
});

// Stripe Mock Data
export const mockStripeResponse = (): MockDataResponse => ({
  success: true,
  data: {
    sessionUrl: "#mock-checkout-session",
    sessionId: "mock_session_123"
  },
  isMockData: true,
  message: "通信に失敗したため、モックデータを表示しています。決済機能は現在利用できません。"
});

// Get mock data by endpoint
export const getMockDataByEndpoint = (endpoint: string): MockDataResponse => {
  switch (endpoint) {
    case '/openai-chat':
      return mockChatResponse();
    case '/openai-vision':
      return mockVisionResponse();
    case '/openai-generate':
      return mockGenerateResponse();
    case '/tripadvisor':
      return mockTripAdvisorResponse();
    case '/google-maps':
    case '/google-places':
      return mockGoogleMapsResponse();
    case '/esim':
      return mockESIMResponse();
    case '/amadeus':
      return mockAmadeusResponse();
    case '/currency-convert':
      return mockCurrencyResponse();
    case '/create-checkout-session':
    case '/verify-payment':
      return mockStripeResponse();
    default:
      return {
        success: false,
        data: null,
        isMockData: true,
        message: "APIサービスが一時的に利用できません。基本機能をご利用ください。"
      };
  }
};

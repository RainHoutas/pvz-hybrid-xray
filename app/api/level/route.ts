import { NextRequest, NextResponse } from "next/server";

export interface LevelMetadata {
  fileUrl: string;
  [key: string]: any;
}

export interface LevelCombinedData {
  metadata: LevelMetadata;
  details: any;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing 'id' parameter" },
      { status: 400 }
    );
  }

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    };

    // 1. 请求元数据
    const metadataRes = await fetch(
      `https://api.pvzhe.com/workshop/levels/${id}`,
      { headers, next: { revalidate: 86400 } }
    );

    if (metadataRes.status === 404) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }
    
    if (!metadataRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch level metadata" },
        { status: metadataRes.status }
      );
    }

    const metadata: LevelMetadata = await metadataRes.json();
    const fileUrl = metadata.fileUrl;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Level metadata is missing fileUrl" },
        { status: 500 }
      );
    }

    // 2. 请求关卡详情
    const detailsUrl = fileUrl.startsWith('http') ? fileUrl : `https://api.pvzhe.com${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    const detailsRes = await fetch(detailsUrl, { headers, next: { revalidate: 86400 } });
    
    if (!detailsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch level details" },
        { status: detailsRes.status }
      );
    }

    const details = await detailsRes.json();

    // 3. 组合并返回数据
    const responseData: LevelCombinedData = {
      metadata,
      details,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching level data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

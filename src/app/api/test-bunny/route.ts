import { NextRequest, NextResponse } from "next/server";

const BUNNY_STORAGE_HOST = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || "jh.storage.bunnycdn.com";
const BUNNY_STORAGE_ZONE = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || "histoview";
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_API_KEY || "213c0699-7662-4802-8017bd573513-a997-4abe";
const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "https://histoview.b-cdn.net";

export async function GET(req: NextRequest) {
  const results: any = {
    config: {
      host: BUNNY_STORAGE_HOST,
      zone: BUNNY_STORAGE_ZONE,
      keySet: !!BUNNY_STORAGE_API_KEY,
      cdn: BUNNY_CDN_URL,
    },
    tests: {},
  };

  // Test 1: Upload a test file
  const testContent = "Bunny Storage Test - " + new Date().toISOString();
  const testPath = `test/test-file-${Date.now()}.txt`;
  const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${testPath}`;
  
  console.log("Testing upload to:", uploadUrl);

  try {
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "AccessKey": BUNNY_STORAGE_API_KEY!,
        "Content-Type": "text/plain",
      },
      body: testContent,
    });
    
    console.log("Upload response:", uploadResponse.status, uploadResponse.statusText);
    
    results.tests.upload = {
      status: uploadResponse.status,
      ok: uploadResponse.ok,
      url: `${BUNNY_CDN_URL}/${testPath}`,
    };

    // Test 2: Read the file back
    if (uploadResponse.ok) {
      const readUrl = `${BUNNY_CDN_URL}/${testPath}`;
      console.log("Reading from:", readUrl);
      const readResponse = await fetch(readUrl);
      results.tests.read = {
        status: readResponse.status,
        ok: readResponse.ok,
      };

      // Test 3: Delete the test file
      const deleteResponse = await fetch(uploadUrl, {
        method: "DELETE",
        headers: {
          "AccessKey": BUNNY_STORAGE_API_KEY!,
        },
      });
      results.tests.delete = {
        status: deleteResponse.status,
        ok: deleteResponse.ok,
      };
    }
  } catch (error: any) {
    results.tests.upload = { error: error.message };
  }

  const allPassed = results.tests.upload?.ok && results.tests.read?.ok && results.tests.delete?.ok;
  
  return NextResponse.json({
    ...results,
    allTestsPassed: allPassed,
    message: allPassed ? "Bunny Storage is working!" : "Some tests failed",
  }, { status: allPassed ? 200 : 500 });
}

import chalk from 'chalk'
import { generateChatResponse, generateConversationTitle } from '../src/utils/chatbot.service'
import { createMessage } from '@utils/conversation.helper'
import { MessageRole } from '@database/models/conversation.model'

interface TestCase {
  name: string
  input: string
  expectedKeywords?: string[]
  timeout?: number
}

const testCases: TestCase[] = [
  {
    name: 'Chào hỏi cơ bản',
    input: 'Xin chào! Tôi cần hỗ trợ.',
    expectedKeywords: ['chào', 'hỗ trợ', 'shopee'],
    timeout: 5000,
  },
  {
    name: 'Hỏi về sản phẩm',
    input: 'Tôi muốn tìm điện thoại iPhone có giá rẻ nhất.',
    expectedKeywords: ['điện thoại', 'iphone', 'giá'],
    timeout: 5000,
  },
  {
    name: 'Hỏi về đơn hàng',
    input: 'Làm sao để kiểm tra trạng thái đơn hàng của tôi?',
    expectedKeywords: ['đơn hàng', 'kiểm tra', 'trạng thái'],
    timeout: 5000,
  },
  {
    name: 'Hỏi về chính sách đổi trả',
    input: 'Chính sách đổi trả sản phẩm của Shopee như thế nào?',
    expectedKeywords: ['đổi trả', 'chính sách', 'shopee'],
    timeout: 5000,
  },
  {
    name: 'Hỏi về giao hàng',
    input: 'Shopee có giao hàng tận nơi không? Phí giao hàng bao nhiêu?',
    expectedKeywords: ['giao hàng', 'phí', 'tận nơi'],
    timeout: 5000,
  },
  {
    name: 'Tin nhắn không liên quan',
    input: 'Hôm nay thời tiết thế nào?',
    expectedKeywords: ['shopee', 'hỗ trợ', 'mua sắm'],
    timeout: 5000,
  },
]

class ChatbotTester {
  private passedTests = 0
  private failedTests = 0
  private results: Array<{
    test: string
    status: 'PASS' | 'FAIL'
    response?: string
    error?: string
    duration?: number
  }> = []

  async runAllTests(): Promise<void> {
    console.log(chalk.blue('🤖 Bắt đầu test chatbot...'))
    console.log(chalk.gray(`Tổng cộng ${testCases.length} test cases\n`))

    for (const testCase of testCases) {
      await this.runSingleTest(testCase)
    }

    this.printSummary()
  }

  private async runSingleTest(testCase: TestCase): Promise<void> {
    const startTime = Date.now()

    try {
      console.log(chalk.yellow(`⏳ Testing: ${testCase.name}`))
      console.log(chalk.gray(`   Input: "${testCase.input}"`))

      // Test response generation
      const response = await this.withTimeout(
        generateChatResponse([], testCase.input),
        testCase.timeout || 5000,
      )

      const duration = Date.now() - startTime

      // Validate response
      const isValid = this.validateResponse(response, testCase.expectedKeywords)

      if (isValid) {
        this.passedTests++
        console.log(chalk.green(`✅ PASS (${duration}ms)`))
        console.log(
          chalk.gray(
            `   Response: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`,
          ),
        )

        this.results.push({
          test: testCase.name,
          status: 'PASS',
          response: response.substring(0, 200),
          duration,
        })
      } else {
        this.failedTests++
        console.log(chalk.red(`❌ FAIL (${duration}ms)`))
        console.log(chalk.gray(`   Response: "${response}"`))
        console.log(chalk.red(`   Expected keywords: ${testCase.expectedKeywords?.join(', ')}`))

        this.results.push({
          test: testCase.name,
          status: 'FAIL',
          response,
          duration,
        })
      }
    } catch (error) {
      const duration = Date.now() - startTime
      this.failedTests++

      console.log(chalk.red(`❌ FAIL (${duration}ms)`))
      console.log(chalk.red(`   Error: ${error.message}`))

      this.results.push({
        test: testCase.name,
        status: 'FAIL',
        error: error.message,
        duration,
      })
    }

    console.log() // Empty line for readability
  }

  private validateResponse(response: string, expectedKeywords?: string[]): boolean {
    if (!response || response.trim().length === 0) {
      return false
    }

    // Check if response contains expected keywords (case insensitive)
    if (expectedKeywords && expectedKeywords.length > 0) {
      const lowerResponse = response.toLowerCase()
      const hasKeywords = expectedKeywords.some((keyword) =>
        lowerResponse.includes(keyword.toLowerCase()),
      )
      return hasKeywords
    }

    return true
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ])
  }

  private printSummary(): void {
    console.log(chalk.blue('📊 KẾT QUẢ TEST TỔNG KẾT'))
    console.log(chalk.blue('═'.repeat(50)))
    console.log(chalk.green(`✅ Passed: ${this.passedTests}`))
    console.log(chalk.red(`❌ Failed: ${this.failedTests}`))
    console.log(
      chalk.blue(`📈 Success Rate: ${((this.passedTests / testCases.length) * 100).toFixed(1)}%`),
    )

    const avgDuration =
      this.results.filter((r) => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) /
      this.results.length

    console.log(chalk.gray(`⏱️  Average Response Time: ${avgDuration.toFixed(0)}ms`))
    console.log()

    // Print failed tests details
    const failedResults = this.results.filter((r) => r.status === 'FAIL')
    if (failedResults.length > 0) {
      console.log(chalk.red('❌ CHI TIẾT TESTS FAILED:'))
      failedResults.forEach((result) => {
        console.log(chalk.red(`   • ${result.test}`))
        if (result.error) {
          console.log(chalk.gray(`     Error: ${result.error}`))
        }
      })
      console.log()
    }

    // Exit with appropriate code
    process.exit(this.failedTests > 0 ? 1 : 0)
  }
}

// Test conversation title generation
async function testTitleGeneration(): Promise<void> {
  console.log(chalk.blue('📝 Testing conversation title generation...'))

  const titleTests = [
    'Xin chào! Tôi muốn hỏi về chính sách đổi trả sản phẩm.',
    'Làm sao để kiểm tra đơn hàng?',
    'Tôi cần tìm điện thoại iPhone với giá tốt nhất.',
    'Shopee có giao hàng miễn phí không?',
  ]

  for (const input of titleTests) {
    try {
      const title = await generateConversationTitle(input)
      console.log(chalk.green(`✅ "${input}" → "${title}"`))
    } catch (error) {
      console.log(chalk.red(`❌ "${input}" → Error: ${error.message}`))
    }
  }
  console.log()
}

// Main execution
async function main(): Promise<void> {
  try {
    console.log(chalk.blue('🚀 CHATBOT TEST SUITE'))
    console.log(chalk.blue('═'.repeat(50)))
    console.log()

    // Check environment
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(chalk.yellow('⚠️  ANTHROPIC_API_KEY không được cấu hình'))
      console.log(chalk.yellow('   Tests sẽ chạy với fallback responses'))
      console.log()
    }

    await testTitleGeneration()

    const tester = new ChatbotTester()
    await tester.runAllTests()
  } catch (error) {
    console.error(chalk.red('💥 Test suite failed:'), error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { ChatbotTester, testCases }
